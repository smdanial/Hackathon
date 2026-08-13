import threading

from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import send_password_reset_email
from .models import RoleCredential, Student
from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SignupSerializer,
    StudentSerializer,
)


class SignupView(generics.CreateAPIView):
    """Create a student account and return an auth token for it."""

    queryset = Student.objects.all()
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        token, _ = Token.objects.get_or_create(user=student)
        return Response(
            {
                "token": token.key,
                "student": StudentSerializer(
                    student, context={"request": request}
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Log in with an email/ID + password and return an auth token."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.validated_data["student"]
        # Role reconciliation: roles the user holds without a matching
        # admin-managed credential (name + department + ID) are removed so
        # the login response always reflects the current credential list.
        reconcile_roles(student)
        token, _ = Token.objects.get_or_create(user=student)
        return Response(
            {
                "token": token.key,
                "student": StudentSerializer(
                    student, context={"request": request}
                ).data,
            }
        )


class MeView(APIView):
    """Read (GET) and update (PATCH) the authenticated student's profile.

    Accepts JSON or multipart/form-data (for ``profile_picture`` uploads).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = StudentSerializer(
            request.user, context={"request": request}
        )
        return Response(serializer.data)

    def patch(self, request):
        serializer = StudentSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LogoutView(APIView):
    """Revoke the current auth token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Role codes (RoleCredential.role) -> the Student flag they grant.
ROLE_FLAGS = {
    "cr": "is_cr",
    "club_member": "is_club_member",
    "librarian": "is_librarian",
}

ROLE_LABELS = {
    "cr": "Class Representative (CR)",
    "club_member": "Club Member",
    "librarian": "Librarian",
}


def reconcile_roles(student):
    """Drop credential-managed roles the student no longer qualifies for.

    Called on login: for each role the student currently holds (CR, Club
    Member, Librarian), the student's own profile data (full_name +
    department + student_id) is matched against the admin-managed
    RoleCredential rows. Matching rows leave the role untouched; a held role
    with no matching credential is removed automatically. Driver
    (``role``/``assigned_route``) is not credential-managed and is untouched.

    Returns the list of role codes that were removed.
    """

    held = [r for r, flag in ROLE_FLAGS.items() if getattr(student, flag)]
    if not held:
        return []

    credentials = set(
        RoleCredential.objects.filter(
            full_name__iexact=student.full_name.strip(),
            department__iexact=(student.department or "").strip(),
            student_id__iexact=student.student_id.strip(),
        ).values_list("role", flat=True)
    )

    removed = []
    for role in held:
        if role not in credentials:
            setattr(student, ROLE_FLAGS[role], False)
            removed.append(role)
    if removed:
        student.save(update_fields=[ROLE_FLAGS[r] for r in removed])
    return removed


class VerifyRoleView(APIView):
    """Self-verify role credentials against the admin-managed list.

    The student's own profile data (full_name + department + student_id) is
    matched — case-insensitively — against the RoleCredential rows the admin
    recorded. Every matching role is granted automatically (``is_cr``,
    ``is_librarian``, ``is_club_member``). Pass an optional ``role`` in the
    body to check a single role, or omit it to check all three at once.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        role = str(request.data.get("role", "")).strip().lower()

        if role and role not in ROLE_FLAGS:
            return Response(
                {"detail": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Match on the student's own profile values — never values sent in
        # the body — so the check can't be spoofed.
        qs = RoleCredential.objects.filter(
            full_name__iexact=user.full_name.strip(),
            department__iexact=(user.department or "").strip(),
            student_id__iexact=user.student_id.strip(),
        )
        if role:
            qs = qs.filter(role=role)

        granted = []
        for credential in qs:
            flag = ROLE_FLAGS[credential.role]
            if not getattr(user, flag):
                setattr(user, flag, True)
                granted.append(credential.role)
        if granted:
            user.save(update_fields=[ROLE_FLAGS[r] for r in granted])

        # When checking one role, only report that role as held; otherwise
        # report every role the student currently holds.
        if role:
            held = [role] if getattr(user, ROLE_FLAGS[role]) else []
        else:
            held = [r for r, flag in ROLE_FLAGS.items() if getattr(user, flag)]

        if granted:
            detail = "Verified — you are now " + _and_list(
                [ROLE_LABELS[r] for r in granted]
            ) + "."
        elif held:
            detail = "Verified — you already hold " + _and_list(
                [ROLE_LABELS[r] for r in held]
            ) + "."
        elif role:
            detail = (
                "No match for that role. Ask an admin to add your name, "
                "department and ID under the matching role."
            )
        else:
            detail = (
                "No role matched your name, department and ID. Ask an admin "
                "to add your details, or grant the role directly from the "
                "admin panel."
            )

        return Response(
            {
                "detail": detail,
                "granted": granted,
                "roles": held,
                "student": StudentSerializer(
                    user, context={"request": request}
                ).data,
            }
        )


def _and_list(items):
    """Join labels naturally: ["A", "B"] -> "A and B" (never empty)."""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{', '.join(items[:-1])} and {items[-1]}"


class PasswordResetView(APIView):
    """Step 1 of the forgot-password flow.

    Looks up the account by email or student ID, generates a reset token and
    emails the student a reset link via Resend. Always returns the same
    success message (whether or not the account exists) so the API never
    reveals which identifiers are registered, and never exposes the reset
    code. The email is sent in a background thread so the response stays
    instant even when the mail provider is slow.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data["identifier"].strip()

        student = None
        if "@" in identifier:
            student = Student.objects.filter(email__iexact=identifier).first()
        if student is None:
            student = Student.objects.filter(student_id__iexact=identifier).first()

        if student is not None and student.is_active:
            uidb64 = urlsafe_base64_encode(force_bytes(student.pk))
            token = PasswordResetTokenGenerator().make_token(student)
            threading.Thread(
                target=send_password_reset_email,
                args=(student, uidb64, token),
                daemon=True,
            ).start()
        return Response(
            {
                "detail": (
                    "If an account exists with that email or ID, a password "
                    "reset link has been sent to the email on file."
                )
            }
        )


class PasswordResetConfirmView(APIView):
    """Step 2: validate the reset token and set the new password.

    Revokes any existing auth tokens so the reset logs other sessions out.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.validated_data["student"]

        student.set_password(serializer.validated_data["new_password"])
        student.save(update_fields=["password"])
        # Invalidate any existing sessions for this account.
        Token.objects.filter(user=student).delete()
        return Response(
            {"detail": "Password updated. You can now log in with your new password."}
        )
