from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import BUS_ROUTES
from .models import BusLocation
from .serializers import BusLocationSerializer

# Route codes that exist ("farmgate", "uttara"). Gabtoli was retired.
KNOWN_ROUTES = {code for code, _label in BUS_ROUTES}


class UpdateLocationView(APIView):
    """POST /api/bus/update-location/ — a driver shares their live GPS fix.

    The route is inferred from ``request.user.assigned_route`` (never taken
    from the request body), so a driver cannot spoof another route's bus.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "driver":
            return Response(
                {"detail": "Only bus drivers can share their location."},
                status=status.HTTP_403_FORBIDDEN,
            )
        route = request.user.assigned_route
        if not route:
            return Response(
                {
                    "detail": (
                        "No route is assigned to this driver account. "
                        "Ask an admin to assign one."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            latitude = float(request.data.get("latitude"))
            longitude = float(request.data.get("longitude"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "latitude and longitude must be numbers."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            return Response(
                {"detail": "latitude and longitude are out of range."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        location, _ = BusLocation.objects.update_or_create(
            route=route,
            defaults={
                "latitude": latitude,
                "longitude": longitude,
                "is_active": True,
                "last_updated": timezone.now(),
            },
        )
        return Response(
            BusLocationSerializer(location).data, status=status.HTTP_200_OK
        )


class StopSharingView(APIView):
    """POST /api/bus/stop-sharing/ — a driver marks their route's bus offline."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "driver":
            return Response(
                {"detail": "Only bus drivers can stop sharing their location."},
                status=status.HTTP_403_FORBIDDEN,
            )
        route = request.user.assigned_route
        if not route:
            return Response(
                {"detail": "No route is assigned to this driver account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        BusLocation.objects.filter(route=route).update(
            is_active=False, last_updated=timezone.now()
        )
        return Response({"detail": "Location sharing stopped."})


class BusLocationDetailView(APIView):
    """GET /api/bus/location/<route>/ — the current bus position for a route.

    Requires sign-in (students must be logged in to use the Bus Tracker).
    A route with no row yet — or one whose driver stopped sharing — comes
    back with ``is_active: False`` so the frontend shows the offline state.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, route):
        if route not in KNOWN_ROUTES:
            return Response(
                {"detail": "Unknown bus route."},
                status=status.HTTP_404_NOT_FOUND,
            )
        location = BusLocation.objects.filter(route=route).first()
        if location is None:
            return Response(
                {
                    "route": route,
                    "latitude": None,
                    "longitude": None,
                    "last_updated": None,
                    "is_active": False,
                }
            )
        return Response(BusLocationSerializer(location).data)
