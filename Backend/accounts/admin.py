from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Student


@admin.register(Student)
class StudentAdmin(UserAdmin):
    model = Student
    ordering = ["email"]
    list_display = ["full_name", "email", "student_id", "phone", "is_active"]
    search_fields = ["full_name", "email", "student_id"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "student_id", "phone")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "student_id", "password1", "password2"),
            },
        ),
    )
