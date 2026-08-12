from django.conf import settings
from django.db import models


class Book(models.Model):
    """A library book (physical copy or uploaded PDF).

    Everyone can browse the catalogue; only Librarians (``is_librarian``) can
    add books, upload PDFs and update or remove entries. ``pdf_file`` stores
    the uploaded document; ``cover_url`` is an external cover image
    (e.g. OpenLibrary) so seeded books can show real covers without uploads.
    """

    class Format(models.TextChoices):
        PHYSICAL = "Physical", "Physical"
        PDF = "PDF", "PDF"

    class Status(models.TextChoices):
        AVAILABLE = "Available", "Available"
        TAKEN = "Taken", "Taken"

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    isbn = models.CharField(max_length=50, blank=True, default="")
    format = models.CharField(
        max_length=10, choices=Format.choices, default=Format.PHYSICAL
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.AVAILABLE
    )
    cover_url = models.URLField(blank=True, default="")
    pdf_file = models.FileField(upload_to="book_pdfs/", blank=True, null=True)
    # Only meaningful while status is "Taken".
    return_date = models.DateField(null=True, blank=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="books",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return f"{self.title} — {self.author}"
