from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Student
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


class PasswordResetView(APIView):
    """Step 1 of the forgot-password flow.

    Looks up the account by email or student ID and generates a reset token.
    Always returns success (whether or not the account exists) to avoid
    revealing which identifiers are registered. In DEBUG the uidb64 + token
    are included in the response — the dev stand-in for a reset email.
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

        data = {
            "detail": (
                "If an account exists with that email or ID, a password reset "
                "link has been generated."
            )
        }
        if student is not None and student.is_active:
            uidb64 = urlsafe_base64_encode(force_bytes(student.pk))
            token = PasswordResetTokenGenerator().make_token(student)
            if settings.DEBUG:
                # Dev stand-in for the emailed reset link — see frontend.
                data["uidb64"] = uidb64
                data["token"] = token
            # Production: email uidb64 + token (or a link containing them).
        return Response(data)


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
