from tempfile import mkdtemp

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Book

# Each run uploads PDFs; isolate the media root so Django's file storage
# never hits a leftover same-named file (which adds a dedup suffix).
TEST_MEDIA_ROOT = mkdtemp(prefix="campusease-library-tests-")


def _student(email, department="CSE", is_cr=False, is_librarian=False):
    """Create a student account with an auth token."""
    Student = get_user_model()
    student = Student(
        email=email,
        full_name="Test Student",
        student_id=f"NIT-{email.split('@')[0]}",
        department=department,
        is_cr=is_cr,
        is_librarian=is_librarian,
    )
    student.set_password("hackathon123")
    student.save()
    token, _ = Token.objects.get_or_create(user=student)
    return student, token.key


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class DepartmentBookApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_cr_creates_book_forced_to_own_department(self):
        _, token = _student("cr@student.edu", department="CSE", is_cr=True)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.post(
            "/api/library/",
            {
                "title": "Syllabus Notes",
                "author": "CR",
                "format": "PDF",
                "status": "Available",
                # Spoof attempt — must be overridden with the CR's department.
                "department": "EEE",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["department"], "CSE")
        self.assertEqual(resp.data["added_by_name"], "Test Student")

    def test_plain_student_cannot_create_book(self):
        _, token = _student("plain@student.edu")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.post(
            "/api/library/",
            {"title": "Nope", "author": "x", "format": "PDF", "status": "Available"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_cr_without_department_is_rejected(self):
        _, token = _student("nodept@student.edu", department="", is_cr=True)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.post(
            "/api/library/",
            {"title": "X", "author": "x", "format": "PDF", "status": "Available"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_department_scoped_reads(self):
        cse_cr, cse_token = _student("cr@student.edu", department="CSE", is_cr=True)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {cse_token}")
        self.client.post(
            "/api/library/",
            {"title": "CSE Notes", "author": "CR", "format": "PDF", "status": "Available"},
            format="json",
        )
        Book.objects.create(
            title="Campus Handbook", author="Library", format="Physical",
            status="Available", department="",
        )

        # Same department sees campus-wide + its own CR books.
        _, cse_student_token = _student("cse@student.edu", department="CSE")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {cse_student_token}")
        resp = self.client.get("/api/library/?department=CSE")
        titles = [b["title"] for b in resp.data]
        self.assertIn("Campus Handbook", titles)
        self.assertIn("CSE Notes", titles)

        # A different department never sees the CSE CR book.
        _, eee_token = _student("eee@student.edu", department="EEE")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {eee_token}")
        resp = self.client.get("/api/library/?department=EEE")
        titles = [b["title"] for b in resp.data]
        self.assertIn("Campus Handbook", titles)
        self.assertNotIn("CSE Notes", titles)

    def test_cr_update_cannot_rescope_book(self):
        cr, cr_token = _student("cr@student.edu", department="CSE", is_cr=True)
        book = Book.objects.create(
            title="CSE Notes", author="CR", format="PDF", status="Available",
            department="CSE", added_by=cr,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {cr_token}")
        resp = self.client.patch(
            f"/api/library/{book.id}/",
            {"department": "EEE", "status": "Taken"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["department"], "CSE")
        self.assertEqual(resp.data["status"], "Taken")

    def test_other_department_cr_cannot_manage_cse_book(self):
        cr, _ = _student("cr@student.edu", department="CSE", is_cr=True)
        Book.objects.create(
            title="CSE Notes", author="CR", format="PDF", status="Available",
            department="CSE", added_by=cr,
        )
        _, eee_cr_token = _student("eee_cr@student.edu", department="EEE", is_cr=True)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {eee_cr_token}")
        resp = self.client.patch(
            f"/api/library/{Book.objects.get(title='CSE Notes').id}/",
            {"status": "Taken"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_campus_book_is_librarian_only(self):
        Book.objects.create(
            title="Campus Handbook", author="Library", format="Physical",
            status="Available", department="",
        )
        _, cr_token = _student("cr@student.edu", department="CSE", is_cr=True)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {cr_token}")
        resp = self.client.patch(
            f"/api/library/{Book.objects.get(title='Campus Handbook').id}/",
            {"status": "Taken"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

        _, lib_token = _student("lib@student.edu", department="EEE", is_librarian=True)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {lib_token}")
        resp = self.client.patch(
            f"/api/library/{Book.objects.get(title='Campus Handbook').id}/",
            {"status": "Taken"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)

    def test_pdf_upload_with_file(self):
        _, token = _student("cr@student.edu", department="CSE", is_cr=True)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.post(
            "/api/library/",
            {
                "title": "With File",
                "author": "CR",
                "format": "PDF",
                "status": "Available",
                "pdf_file": ContentFile(b"%PDF-1.4 test", name="notes.pdf"),
            },
            format="multipart",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(resp.data["pdf_file"].endswith("notes.pdf"))
        self.assertEqual(resp.data["department"], "CSE")
