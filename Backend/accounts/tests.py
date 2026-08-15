from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import RoleCredential


class UserManagerTests(TestCase):
    def test_create_superuser_uses_email_without_username(self):
        user = get_user_model().objects.create_superuser(
            email="admin@student.edu",
            password="StrongPass123!",
            full_name="Admin User",
            student_id="ADMIN-001",
        )

        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertEqual(user.email, "admin@student.edu")
        self.assertEqual(user.student_id, "ADMIN-001")


def _student(email, full_name, student_id, department, **flags):
    Student = get_user_model()
    student = Student(
        email=email,
        full_name=full_name,
        student_id=student_id,
        department=department,
        **flags,
    )
    student.set_password("hackathon123")
    student.save()
    token, _ = Token.objects.get_or_create(user=student)
    return student, token.key


class VerifyRoleApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _verify(self, token, body=None):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        return self.client.post("/api/auth/verify-role/", body or {}, format="json")

    def test_grants_role_on_exact_match(self):
        _, token = _student(
            "sabiha@student.edu", "Sabiha Rahman", "NIT-3301010", "TE"
        )
        RoleCredential.objects.create(
            role="club_member",
            full_name="Sabiha Rahman",
            department="TE",
            student_id="NIT-3301010",
        )
        resp = self._verify(token)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["granted"], ["club_member"])
        self.assertTrue(resp.data["student"]["is_club_member"])
        user = get_user_model().objects.get(email="sabiha@student.edu")
        self.assertTrue(user.is_club_member)
        self.assertFalse(user.is_cr)

    def test_match_is_case_insensitive(self):
        _, token = _student(
            "sabiha@student.edu", "sabiha rahman", "nit-3301010", "te"
        )
        RoleCredential.objects.create(
            role="club_member",
            full_name="Sabiha Rahman",
            department="TE",
            student_id="NIT-3301010",
        )
        resp = self._verify(token)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["granted"], ["club_member"])

    def test_repeated_verify_reports_already_held(self):
        _, token = _student(
            "sabiha@student.edu", "Sabiha Rahman", "NIT-3301010", "TE"
        )
        RoleCredential.objects.create(
            role="club_member",
            full_name="Sabiha Rahman",
            department="TE",
            student_id="NIT-3301010",
        )
        self._verify(token)
        resp = self._verify(token)
        self.assertEqual(resp.data["granted"], [])
        self.assertEqual(resp.data["roles"], ["club_member"])

    def test_no_match_reports_nothing(self):
        _, token = _student(
            "arif@student.edu", "Arif Hasan", "NIT-2101004", "CSE"
        )
        resp = self._verify(token)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["granted"], [])
        self.assertEqual(resp.data["roles"], [])
        user = get_user_model().objects.get(email="arif@student.edu")
        self.assertFalse(user.is_cr)

    def test_single_role_filter(self):
        student, token = _student(
            "sabiha@student.edu", "Sabiha Rahman", "NIT-3301010", "TE"
        )
        RoleCredential.objects.create(
            role="club_member",
            full_name="Sabiha Rahman",
            department="TE",
            student_id="NIT-3301010",
        )
        # Asking for a role the student does not hold reports no match and
        # never grants the unrelated held role's message.
        resp = self._verify(token, {"role": "cr"})
        self.assertEqual(resp.data["granted"], [])
        self.assertEqual(resp.data["roles"], [])
        self.assertFalse(student.is_cr)

        resp = self._verify(token, {"role": "club_member"})
        self.assertEqual(resp.data["granted"], ["club_member"])

    def test_invalid_role_rejected(self):
        _, token = _student(
            "arif@student.edu", "Arif Hasan", "NIT-2101004", "CSE"
        )
        resp = self._verify(token, {"role": "superhero"})
        self.assertEqual(resp.status_code, 400)

    def test_anonymous_rejected(self):
        resp = self.client.post("/api/auth/verify-role/", {}, format="json")
        self.assertEqual(resp.status_code, 401)

    def test_credential_does_not_self_assign_without_auth(self):
        # RoleCredential rows are only readable in the Django admin — there
        # is no public list endpoint.
        self.assertEqual(RoleCredential.objects.count(), 0)


class LoginRoleReconciliationTests(TestCase):
    """On login, held roles without a matching credential are removed."""

    def setUp(self):
        self.client = APIClient()

    def _login(self, identifier, password="hackathon123"):
        return self.client.post(
            "/api/auth/login/",
            {"identifier": identifier, "password": password},
            format="json",
        )

    def test_role_kept_when_credential_matches(self):
        student, _ = _student(
            "arif@student.edu", "Arif Hasan", "NIT-2101004", "CSE",
            is_cr=True,
        )
        RoleCredential.objects.create(
            role="cr", full_name="Arif Hasan", department="CSE",
            student_id="NIT-2101004",
        )
        resp = self._login("arif@student.edu")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data["student"]["is_cr"])
        student.refresh_from_db()
        self.assertTrue(student.is_cr)

    def test_role_removed_when_credential_missing(self):
        student, _ = _student(
            "arif@student.edu", "Arif Hasan", "NIT-2101004", "CSE",
            is_cr=True,
        )
        # No RoleCredential row for Arif.
        resp = self._login("arif@student.edu")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data["student"]["is_cr"])
        student.refresh_from_db()
        self.assertFalse(student.is_cr)

    def test_only_matching_roles_survive(self):
        # Holds CR + Club Member; only the Club Member credential exists.
        student, _ = _student(
            "sabiha@student.edu", "Sabiha Rahman", "NIT-3301010", "TE",
            is_cr=True, is_club_member=True,
        )
        RoleCredential.objects.create(
            role="club_member", full_name="Sabiha Rahman", department="TE",
            student_id="NIT-3301010",
        )
        resp = self._login("sabiha@student.edu")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data["student"]["is_cr"])
        self.assertTrue(resp.data["student"]["is_club_member"])
        student.refresh_from_db()
        self.assertFalse(student.is_cr)
        self.assertTrue(student.is_club_member)

    def test_plain_student_unaffected(self):
        student, _ = _student(
            "plain@student.edu", "Plain Student", "NIT-000000", "CSE"
        )
        resp = self._login("plain@student.edu")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data["student"]["is_cr"])
        student.refresh_from_db()
        self.assertFalse(student.is_cr)
        self.assertFalse(student.is_librarian)

    def test_driver_role_not_touched(self):
        # Drivers are managed by the admin directly, not via credentials.
        student, _ = _student(
            "driver@student.edu", "Rafiqul Islam", "DRV-001", "CSE",
            is_cr=True, role="driver", assigned_route="farmgate",
        )
        resp = self._login("driver@student.edu")
        self.assertEqual(resp.status_code, 200)
        student.refresh_from_db()
        self.assertEqual(student.role, "driver")
        self.assertEqual(student.assigned_route, "farmgate")
        # Only the credential-managed CR flag is reconciled away.
        self.assertFalse(student.is_cr)
