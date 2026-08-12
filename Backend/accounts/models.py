from django.contrib.auth.models import AbstractUser
from django.db import models

# Canonical department codes — used by signup, the profile, room bookings
# and department-scoped notices.
DEPARTMENTS = ["CSE", "EEE", "TE", "IPE", "FDAE"]


class Student(AbstractUser):
    """A CampusEase student account.

    Students sign in with either their email or their student ID, so both are
    unique. ``username`` is disabled and ``email`` is the auth identifier.
    """

    username = None

    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    student_id = models.CharField("Student ID", max_length=50, unique=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/", blank=True, null=True
    )
    is_cr = models.BooleanField(
        "Class Representative (CR)",
        default=False,
        help_text=(
            "CRs can book rooms and post/update class and lab notices. "
            "Granted by an admin from the admin panel."
        ),
    )
    is_librarian = models.BooleanField(
        "Librarian",
        default=False,
        help_text=(
            "Librarians can add, upload and update the library's book list. "
            "Granted by an admin from the admin panel."
        ),
    )
    is_club_member = models.BooleanField(
        "Club Member",
        default=False,
        help_text=(
            "Club Members can post and update Club notices, including images "
            "and links. Granted by an admin from the admin panel."
        ),
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "student_id"]

    def __str__(self):
        return f"{self.full_name} ({self.student_id})"
