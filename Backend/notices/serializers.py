from rest_framework import serializers

from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    """Notices are public to read; writes are CR-only.

    CRs may only post/update Class or Lab notices — the category validator
    rejects Club/EMS posts, which stay admin-managed.
    """

    posted_by_name = serializers.CharField(
        source="posted_by.full_name", read_only=True
    )

    class Meta:
        model = Notice
        fields = [
            "id",
            "category",
            "title",
            "body",
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

    def validate_category(self, value):
        if value not in ("class", "lab"):
            raise serializers.ValidationError(
                "CRs can only post Class or Lab notices."
            )
        return value
