from django.contrib import admin

from .models import LabReport


@admin.register(LabReport)
class LabReportAdmin(admin.ModelAdmin):
    list_display = [
        "experiment_name",
        "course_code",
        "department",
        "owner",
        "date_of_submission",
        "created_at",
    ]
    list_filter = ["department", "teacher_department"]
    search_fields = [
        "experiment_name",
        "course_title",
        "course_code",
        "student__full_name",
        "student__student_id",
    ]
