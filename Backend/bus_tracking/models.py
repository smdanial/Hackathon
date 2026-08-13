from django.db import models

from accounts.models import BUS_ROUTES


class BusLocation(models.Model):
    """The latest live position of the bus on a route.

    One row per route (``route`` is unique). Drivers update it via
    POST /api/bus/update-location/ while sharing, and mark it inactive via
    POST /api/bus/stop-sharing/ when they stop.
    """

    route = models.CharField(
        "Route", max_length=20, unique=True, choices=BUS_ROUTES
    )
    latitude = models.FloatField()
    longitude = models.FloatField()
    last_updated = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["route"]

    def __str__(self):
        return (
            f"{self.get_route_display()}: {self.latitude}, {self.longitude} "
            f"({'live' if self.is_active else 'offline'})"
        )
