from rest_framework import serializers

from .models import BusLocation


class BusLocationSerializer(serializers.ModelSerializer):
    """A route's current bus position.

    ``route`` and ``last_updated`` are read-only: the route is always derived
    from the driver's assigned route server-side, and the timestamp is set by
    the database.
    """

    class Meta:
        model = BusLocation
        fields = ["route", "latitude", "longitude", "last_updated", "is_active"]
        read_only_fields = ["route", "last_updated"]
