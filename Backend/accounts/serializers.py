from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers

from .models import DEPARTMENTS, Student


def _lookup_student(identifier):
    """Find a student by email or student ID (case-insensitive)."""
    identifier = (identifier or "").strip()
    if not identifier:
        return None
    student = None
    if "@" in identifier:
        student = Student.objects.filter(email__iexact=identifier).first()
    if student is None:
        student = Student.objects.filter(student_id__iexact=identifier).first()
    return student


class StudentSerializer(serializers.ModelSerializer):
    """Public student profile — never exposes the password.

    Used for reads and for profile updates (PATCH /api/auth/me/). ``student_id``
    is intentionally read-only: it identifies the account.
    """

    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Student
        fields = [
            "id",
            "full_name",
            "email",
            "student_id",
            "phone",
            "department",
            "profile_picture",
            "is_cr",
            "is_librarian",
            "is_club_member",
            "role",
            "assigned_route",
        ]
        # Roles are read-only: granted by an admin from the admin panel,
        # never self-assigned.
        read_only_fields = [
            "id",
            "student_id",
            "is_cr",
            "is_librarian",
            "is_club_member",
            "role",
            "assigned_route",
        ]


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    # Department is required at signup (dropdown on the signup form). It also
    # drives department-scoped class/lab notices.
    department = serializers.ChoiceField(
        choices=DEPARTMENTS,
        error_messages={
            "invalid_choice": "Please select a valid department."
        },
    )

    class Meta:
        model = Student
        fields = [
            "full_name",
            "email",
            "student_id",
            "phone",
            "department",
            "password",
            "confirm_password",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        student = Student(**validated_data)
        student.set_password(password)
        student.save()
        return student


class LoginSerializer(serializers.Serializer):
    """Accepts ``identifier`` (email or student ID) plus ``password``."""

    identifier = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        password = attrs["password"]

        student = _lookup_student(identifier)

        if student is None or not student.check_password(password):
            raise serializers.ValidationError(
                "Invalid email/ID or password."
            )
        if not student.is_active:
            raise serializers.ValidationError("This account is disabled.")

        attrs["student"] = student
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Step 1 of the forgot-password flow: request a reset for an account.

    Accepts ``identifier`` (email or student ID) and, in DEBUG, the API
    returns the ``uidb64`` + ``token`` pair so the frontend can complete the
    flow without an email server (the production path would email a link).
    """

    identifier = serializers.CharField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Step 2: exchange the reset uidb64 + token for a new password.

    Uses Django's PasswordResetTokenGenerator, so tokens expire after the
    default window and are invalidated once the password actually changes.
    """

    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        try:
            uid = urlsafe_base64_decode(attrs["uidb64"]).decode()
            student = Student.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError, Student.DoesNotExist):
            raise serializers.ValidationError(
                "This reset link is invalid. Please request a new one."
            )

        if not PasswordResetTokenGenerator().check_token(student, attrs["token"]):
            raise serializers.ValidationError(
                "This reset link is invalid or has expired. Please request a new one."
            )

        # Run Django's password validators against this student's attributes.
        validate_password(attrs["new_password"], student)

        attrs["student"] = student
        return attrs
