from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import RoleCredential, Student


@admin.register(Student)
class StudentAdmin(UserAdmin):
    model = Student
    ordering = ["email"]
    list_display = [
        "full_name",
        "email",
        "student_id",
        "phone",
        "is_cr",
        "is_librarian",
        "is_club_member",
        "role",
        "assigned_route",
        "is_active",
    ]
    # Grant/revoke roles straight from the student list view, and assign a
    # driver's route from the same row.
    list_editable = [
        "is_cr",
        "is_librarian",
        "is_club_member",
        "role",
        "assigned_route",
    ]
    list_filter = [
        "is_cr",
        "is_librarian",
        "is_club_member",
        "role",
        "is_active",
        "department",
    ]
    search_fields = ["full_name", "email", "student_id"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "student_id", "phone", "department")}),
        ("Role", {"fields": ("is_cr", "is_librarian", "is_club_member")}),
        ("Bus Tracker", {"fields": ("role", "assigned_route")}),
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
        (
            "Bus Tracker",
            {
                "fields": (
                    "role",
                    "assigned_route",
                ),
                "description": (
                    "Pick Driver and choose the route to create a bus driver "
                    "account; leave as Student for regular accounts."
                ),
            },
        ),
    )


@admin.register(RoleCredential)
class RoleCredentialAdmin(admin.ModelAdmin):
    """Admin-only role credentials for the "Verify my role" flow.

    Only staff/superusers can reach this page — there is no public API to
    change these rows. Adding a row here lets the matching student verify
    themselves on the profile and be granted the role automatically.
    """

    list_display = [
        "role",
        "full_name",
        "department",
        "student_id",
        "updated_at",
    ]
    list_filter = ["role", "department"]
    search_fields = ["full_name", "student_id"]
    list_editable = ["full_name", "department", "student_id"]
