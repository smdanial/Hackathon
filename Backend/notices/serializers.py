from rest_framework import serializers

from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    """Notices are public to read; writes are role-gated in the views.

    Class Representatives (CRs) post/update Class and Lab notices for their
    own department; Club Members post/update Club notices. ``image`` accepts
    multipart uploads and serializes to an absolute URL; ``link_url`` is
    validated as a safe http/https/ftp/ftps URL by DRF's URLValidator.
    """

    # allow_null: seeded notices have no ``posted_by`` — the field would be
    # skipped entirely by DRF otherwise (read-only fields are non-required).
    posted_by_name = serializers.CharField(
        source="posted_by.full_name", read_only=True, allow_null=True
    )
    image = serializers.ImageField(required=False, allow_null=True)
    file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Notice
        fields = [
            "id",
            "category",
            "title",
            "body",
            "image",
            "link_url",
            "link_label",
            "file",
            "file_name",
            "department",
            "posted_by",
            "posted_by_name",
            "created_at",
            "updated_at",
        ]
        # ``department`` is read-only: it always comes from the posting CR's
        # own department (set in the view), never from the payload.
        read_only_fields = [
            "id",
            "department",
            "posted_by",
            "created_at",
            "updated_at",
        ]
