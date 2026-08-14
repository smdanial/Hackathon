import re

from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LabReport
from .pdf import build_cover_pdf
from .serializers import LabReportSerializer


def _pdf_filename(course_code: str, experiment_name: str) -> str:
    """A safe download filename, e.g. CSE-301_Stack-using-Array_cover.pdf."""
    code = re.sub(r"[^a-zA-Z0-9-]+", "", course_code or "").strip("-")[:20]
    experiment = re.sub(
        r"[^a-zA-Z0-9]+", "-", experiment_name or ""
    ).strip("-")[:40]
    return f"{code or 'cover'}-{experiment or 'cover'}.pdf"


class LabReportListCreateView(generics.ListCreateAPIView):
    """A student's own lab report cover pages (list + create).

    GET returns only the authenticated student's reports; POST creates one
    owned by them. ``student_name`` and ``student_id`` are always snapshotted
    from the student's own profile, never from the request body.
    """

    serializer_class = LabReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LabReport.objects.filter(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        # The Submitted By block always comes from the student's own profile —
        # the cover page must show their real name and ID.
        data["student_name"] = request.user.full_name
        data["student_id"] = request.user.student_id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LabReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Read / update / delete one of the student's own reports.

    Reports are private to their owner: any request for someone else's report
    is treated as not found.
    """

    serializer_class = LabReportSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return LabReport.objects.filter(owner=self.request.user)


class LabReportPdfView(APIView):
    """Generate the reference NITER cover page as a PDF from the given fields.

    POST the same fields the cover page shows (course details + teacher
    details); the PDF is rendered server-side to match the reference
    "Lab Report Cover.docx" design exactly. The Submitted By identity comes
    from the authenticated student's profile unless the payload supplies
    ``student_name`` / ``student_id`` (e.g. when downloading a saved report
    whose snapshot predates a profile change). Nothing is persisted.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        payload = {
            "department": data.get("department") or request.user.department or "",
            "course_title": data.get("course_title", ""),
            "course_code": data.get("course_code", ""),
            "date_of_submission": data.get("date_of_submission", ""),
            "experiment_name": data.get("experiment_name", ""),
            "remarks": data.get("remarks", ""),
            "section": data.get("section", ""),
            "level_term": data.get("level_term", ""),
            "session": data.get("session", ""),
            "student_name": data.get("student_name") or request.user.full_name,
            "student_id": data.get("student_id") or request.user.student_id,
            "teacher_name": data.get("teacher_name", ""),
            "teacher_rank": data.get("teacher_rank", ""),
            "teacher_department": data.get("teacher_department", ""),
        }
        pdf_bytes = build_cover_pdf(payload)
        filename = _pdf_filename(payload["course_code"], payload["experiment_name"])
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
