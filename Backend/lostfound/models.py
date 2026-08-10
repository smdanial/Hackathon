from django.conf import settings
from django.db import models


class FoundItem(models.Model):
    """An item someone found on campus and reported.

    The photo is optional; finder contact details are collected in the
    report form so owners can get in touch.
    """

    class Category(models.TextChoices):
        ELECTRONICS = "Electronics"
        ACCESSORIES = "Accessories"
        DOCUMENTS = "Documents"
        OTHERS = "Others"

    item_name = models.CharField(max_length=120)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.OTHERS
    )
    description = models.TextField()
    location_found = models.CharField(max_length=200)
    image = models.ImageField(upload_to="lost_found/", blank=True, null=True)
    finder_name = models.CharField(max_length=100)
    finder_phone = models.CharField(max_length=30)
    date_posted = models.DateField(auto_now_add=True)
    # Who reported it. Posting now requires login, so this is always the
    # authenticated student — and only they can mark the item as received.
    # Nullable only so legacy seeded posts keep working without an owner.
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="found_items",
    )
    is_received = models.BooleanField(default=False)
    received_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-date_posted", "-id"]

    def __str__(self):
        return f"{self.item_name} ({self.category})"
