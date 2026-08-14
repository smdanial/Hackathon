from rest_framework import serializers

from .models import Book


class BookSerializer(serializers.ModelSerializer):
    """Library book. Readable by everyone; writes are gated by role.

    ``pdf_file`` is a FileField: it accepts multipart uploads and serializes
    to an absolute URL (or null when no file is attached). ``department`` is
    blank for campus-wide library books and set for CR department uploads.
    """

    pdf_file = serializers.FileField(required=False, allow_null=True)
    # allow_null: seeded books have no ``added_by`` — the field would be
    # skipped entirely by DRF otherwise (read-only fields are non-required).
    added_by_name = serializers.CharField(
        source="added_by.full_name", read_only=True, allow_null=True
    )

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "author",
            "isbn",
            "format",
            "status",
            "cover_url",
            "pdf_file",
            "department",
            "return_date",
            "added_by",
            "added_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "added_by",
            "added_by_name",
            "created_at",
            "updated_at",
        ]
