from django.conf import settings
from django.db import models

from accounts.models import DEPARTMENTS


class Notice(models.Model):
    """A campus notice (class / club / lab / EMS).

    Anyone can read notices; Class Representatives (CRs) can create and
    update Class and Lab notices for their own department, and Club Members
    can create and update Club notices (optionally with an image and a link).
    ``posted_by`` records who published it.
    """

    class Category(models.TextChoices):
        CLASS = "class", "Class"
        CLUB = "club", "Club"
        LAB = "lab", "Lab"
        EMS = "ems", "EMS"

    category = models.CharField(max_length=10, choices=Category.choices)
    title = models.CharField(max_length=200)
    body = models.TextField()
    # Club notices can carry an image and a safe link. ``link_url`` uses
    # Django's URLField validator, which only accepts http/https/ftp/ftps
    # URLs — javascript:, data: and friends are rejected at the API.
    image = models.ImageField(
        upload_to="notice_images/", blank=True, null=True
    )
    link_url = models.URLField(blank=True, default="")
    link_label = models.CharField(max_length=100, blank=True, default="")
    # CRs can attach one file (syllabus PDF, form, notes…) to Class/Lab
    # notices. ``file_name`` keeps the original name for display (Django
    # sanitizes the stored name).
    file = models.FileField(upload_to="notice_files/", blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, default="")
    # Department scoping: Class/Lab notices carry the posting CR's department
    # and are only visible to students of that department. Club/EMS notices
    # are campus-wide (blank department).
    department = models.CharField(
        max_length=10,
        choices=[(dept, dept) for dept in DEPARTMENTS],
        blank=True,
        default="",
    )
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notices",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_category_display()}: {self.title}"
