from django.conf import settings
from django.db import models

from accounts.models import DEPARTMENTS


class Notice(models.Model):
    """A campus notice (class / club / lab / EMS).

    Anyone can read notices; Class Representatives (CRs) can create and
    update Class and Lab notices for their own department. ``posted_by``
    records who published it.
    """

    class Category(models.TextChoices):
        CLASS = "class", "Class"
        CLUB = "club", "Club"
        LAB = "lab", "Lab"
        EMS = "ems", "EMS"

    category = models.CharField(max_length=10, choices=Category.choices)
    title = models.CharField(max_length=200)
    body = models.TextField()
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
