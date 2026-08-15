from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

# Canonical department codes — used by signup, the profile, room bookings
# and department-scoped notices.
DEPARTMENTS = ["CSE", "EEE", "TE", "IPE", "FDAE"]

# Campus bus routes. The code is the API key (BusLocation.route) and the
# label is what students see; drivers get exactly one assigned route.
BUS_ROUTES = [
    ("farmgate", "Farmgate to NITER"),
    ("uttara", "Uttara to NITER"),
]


class StudentManager(BaseUserManager):
    """Manager for email-based auth without a username field."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


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
    # Bus Tracker role. Drivers share their live GPS position on the assigned
    # route from the Bus Tracker; everyone else is a student by default.
    role = models.CharField(
        "Role",
        max_length=20,
        choices=[("student", "Student"), ("driver", "Driver")],
        default="student",
        help_text=(
            "Drivers can share their live bus location from the Bus Tracker. "
            "Granted by an admin from the admin panel."
        ),
    )
    # The bus route a driver drives (students leave this blank). The driver's
    # location updates are always stored under this route, never one taken
    # from the request body.
    assigned_route = models.CharField(
        "Assigned route",
        max_length=20,
        choices=BUS_ROUTES,
        null=True,
        blank=True,
        help_text=("The bus route this driver is assigned to (drivers only)."),
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "student_id"]
    objects = StudentManager()

    def __str__(self):
        return f"{self.full_name} ({self.student_id})"


class RoleCredential(models.Model):
    """Admin-managed role credentials used for self-verification.

    The admin records the name, department and student ID of each CR, Club
    Member and Librarian here (from the Django admin — there is no public
    API to change these rows). When a student taps "Verify my role" on their
    profile, the backend matches their own full_name + department +
    student_id against these rows and grants the matching role automatically.
    """

    class Role(models.TextChoices):
        CR = "cr", "CR (Class Representative)"
        CLUB_MEMBER = "club_member", "Club Member"
        LIBRARIAN = "librarian", "Librarian"

    role = models.CharField(max_length=20, choices=Role.choices)
    full_name = models.CharField("Name", max_length=100)
    department = models.CharField(
        max_length=10,
        choices=[(dept, dept) for dept in DEPARTMENTS],
        help_text=("The department this person belongs to."),
    )
    student_id = models.CharField(
        "Student ID",
        max_length=50,
        help_text=(
            "The student's NIT ID — must exactly match the ID on their profile."
        ),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["role", "full_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["role", "full_name", "department", "student_id"],
                name="unique_role_credential",
            )
        ]

    def __str__(self):
        return f"{self.get_role_display()}: {self.full_name} ({self.student_id})"
