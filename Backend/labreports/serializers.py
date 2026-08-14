from rest_framework import serializers

from .models import LabReport


class LabReportSerializer(serializers.ModelSerializer):
    """A student's lab report cover page.

    Every student manages their own reports: the owner is pinned to the
    authenticated user in the view, never taken from the payload.
    """

    class Meta:
        model = LabReport
        fields = [
            "id",
            "department",
            "course_title",
            "course_code",
            "date_of_submission",
            "experiment_name",
            "remarks",
            "student_name",
            "student_id",
            "section",
            "level_term",
            "session",
            "teacher_name",
            "teacher_rank",
            "teacher_department",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
