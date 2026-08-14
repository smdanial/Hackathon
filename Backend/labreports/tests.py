from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import LabReport


def _student(**overrides):
    """Create a student account with an auth token.

    The custom Student model has no username, so accounts are built directly
    (same path as the signup serializer) rather than via create_user.
    """
    Student = get_user_model()
    email = overrides.pop("email", f"user{Student.objects.count()}@student.edu")
    student = Student(
        email=email,
        full_name=overrides.pop("full_name", "Test Student"),
        student_id=overrides.pop("student_id", f"NIT-{Student.objects.count()}"),
        **overrides,
    )
    student.set_password("hackathon123")
    student.save()
    token, _ = Token.objects.get_or_create(user=student)
    return student, token.key


class LabReportApiTests(APITestCase):
    """Cover-page API: students manage their own reports only."""

    def setUp(self):
        self.arif, self.arif_key = _student(
            email="arif@test.edu", full_name="Arif Hasan", department="CSE"
        )
        self.nusrat, self.nusrat_key = _student(
            email="nusrat@test.edu", full_name="Nusrat Jahan", department="EEE"
        )
        self.arif_token = f"Token {self.arif_key}"
        self.nusrat_token = f"Token {self.nusrat_key}"
        self.payload = {
            "department": "CSE",
            "course_title": "Fundamentals of Computers and Computing",
            "course_code": "CSE-1111",
            "date_of_submission": "2026-08-11",
            "experiment_name": "Introduction of Motherboard",
            "remarks": "",
            "section": "A2",
            "level_term": "1-1",
            "session": "2025-2026",
            "teacher_name": "Sadia Sazzad",
            "teacher_rank": "Assistant Professor",
            "teacher_department": "CSE",
        }

    def test_create_report_snapshots_profile_name_and_id(self):
        # A spoofed student_name/student_id in the body must be ignored —
        # the cover page always shows the student's own profile values.
        payload = {**self.payload, "student_name": "Fake Name", "student_id": "FAKE-1"}
        res = self.client.post(
            "/api/lab-reports/",
            payload,
            format="json",
            HTTP_AUTHORIZATION=self.arif_token,
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["student_name"], "Arif Hasan")
        self.assertEqual(res.data["student_id"], self.arif.student_id)
        self.assertEqual(res.data["course_code"], "CSE-1111")

    def test_reports_are_private_to_their_owner(self):
        res = self.client.post(
            "/api/lab-reports/",
            self.payload,
            format="json",
            HTTP_AUTHORIZATION=self.arif_token,
        )
        self.assertEqual(res.status_code, 201)
        report_id = res.data["id"]

        # Another student cannot read, change or delete it.
        self.assertEqual(
            self.client.get(
                f"/api/lab-reports/{report_id}/",
                HTTP_AUTHORIZATION=self.nusrat_token,
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/lab-reports/{report_id}/",
                {"remarks": "hijacked"},
                format="json",
                HTTP_AUTHORIZATION=self.nusrat_token,
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.delete(
                f"/api/lab-reports/{report_id}/",
                HTTP_AUTHORIZATION=self.nusrat_token,
            ).status_code,
            404,
        )
        # The owner's own list contains exactly their report.
        res = self.client.get(
            "/api/lab-reports/", HTTP_AUTHORIZATION=self.nusrat_token
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 0)

    def test_owner_can_update_and_delete(self):
        res = self.client.post(
            "/api/lab-reports/",
            self.payload,
            format="json",
            HTTP_AUTHORIZATION=self.arif_token,
        )
        report_id = res.data["id"]

        res = self.client.patch(
            f"/api/lab-reports/{report_id}/",
            {"remarks": "Done in lab 4"},
            format="json",
            HTTP_AUTHORIZATION=self.arif_token,
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["remarks"], "Done in lab 4")
        self.assertEqual(res.data["date_of_submission"], "2026-08-11")

        res = self.client.delete(
            f"/api/lab-reports/{report_id}/",
            HTTP_AUTHORIZATION=self.arif_token,
        )
        self.assertEqual(res.status_code, 204)
        self.assertFalse(LabReport.objects.filter(pk=report_id).exists())

    def test_anonymous_is_rejected(self):
        self.assertEqual(
            self.client.get("/api/lab-reports/").status_code, 401
        )
        self.assertEqual(
            self.client.post(
                "/api/lab-reports/", self.payload, format="json"
            ).status_code,
            401,
        )

    def test_date_is_required_and_validated(self):
        payload = {**self.payload, "date_of_submission": ""}
        res = self.client.post(
            "/api/lab-reports/",
            payload,
            format="json",
            HTTP_AUTHORIZATION=self.arif_token,
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("date_of_submission", res.data)

    @staticmethod
    def _pdf_text(content: bytes) -> str:
        """Extract the text from a generated PDF (streams are compressed)."""
        import io
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    def test_pdf_endpoint_returns_an_a4_cover_pdf(self):
        res = self.client.post(
            "/api/lab-reports/pdf/",
            self.payload,
            format="json",
            HTTP_AUTHORIZATION=self.arif_token,
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")
        self.assertIn(
            "attachment; filename=", res["Content-Disposition"].lower()
        )
        body = res.content
        self.assertTrue(body.startswith(b"%PDF-"))
        # One A4 page (595.28 x 841.89 pt at 72dpi).
        import re as _re
        self.assertTrue(
            _re.search(rb"/MediaBox \[ 0 0 595\.2\d+ 841\.8\d+ \]", body)
        )
        text = self._pdf_text(body)
        # The profile identity is used when the payload omits it.
        self.assertIn("Arif Hasan", text)
        self.assertIn("CSE-1111", text)
        self.assertIn("National Institute of Textile Engineering and Research.", text)

    def test_pdf_endpoint_uses_payload_identity_when_provided(self):
        # Downloading a saved report should keep its snapshot name/ID even if
        # the profile changed since the report was saved.
        payload = {**self.payload, "student_name": "Old Name", "student_id": "OLD-1"}
        res = self.client.post(
            "/api/lab-reports/pdf/",
            payload,
            format="json",
            HTTP_AUTHORIZATION=self.arif_token,
        )
        self.assertEqual(res.status_code, 200)
        text = self._pdf_text(res.content)
        self.assertIn("Old Name", text)
        self.assertIn("OLD-1", text)

    def test_pdf_endpoint_requires_authentication(self):
        res = self.client.post(
            "/api/lab-reports/pdf/", self.payload, format="json"
        )
        self.assertEqual(res.status_code, 401)
