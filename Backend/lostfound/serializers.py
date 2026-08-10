from rest_framework import serializers

from .models import FoundItem


class FoundItemSerializer(serializers.ModelSerializer):
    """Found item as served to the frontend.

    ``image`` is an ImageField, so with a request in the serializer context
    it serializes to an absolute URL (e.g. http://localhost:8000/media/...)
    and accepts multipart uploads on create. ``reported_by`` comes from the
    authenticated user and ``is_received``/``received_at`` are set through
    the dedicated "received" endpoint — both are read-only here.
    """

    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = FoundItem
        fields = [
            "id",
            "item_name",
            "category",
            "description",
            "location_found",
            "image",
            "finder_name",
            "finder_phone",
            "date_posted",
            "reported_by",
            "is_received",
            "received_at",
        ]
        read_only_fields = [
            "id",
            "date_posted",
            "reported_by",
            "is_received",
            "received_at",
        ]
