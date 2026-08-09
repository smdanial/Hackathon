from rest_framework import serializers

from .models import FoundItem


class FoundItemSerializer(serializers.ModelSerializer):
    """Found item as served to the frontend.

    ``image`` is an ImageField, so with a request in the serializer context
    it serializes to an absolute URL (e.g. http://localhost:8000/media/...)
    and accepts multipart uploads on create.
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
        ]
        read_only_fields = ["id", "date_posted"]
