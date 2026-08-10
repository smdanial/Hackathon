from django.db.models import Prefetch
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Room, RoomBooking, expire_past_bookings
from .serializers import RoomBookingSerializer, RoomSerializer


class RoomListView(generics.ListAPIView):
    """All rooms with their schedules (public campus info)."""

    serializer_class = RoomSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Release any finished bookings first so the schedule is current.
        expire_past_bookings()
        return Room.objects.prefetch_related(
            "schedule",
            Prefetch(
                "bookings",
                queryset=RoomBooking.objects.select_related("student"),
            ),
        )


class RoomDetailView(generics.RetrieveAPIView):
    """A single room with its schedule and active bookings."""

    serializer_class = RoomSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        expire_past_bookings()
        return Room.objects.prefetch_related(
            "schedule",
            Prefetch(
                "bookings",
                queryset=RoomBooking.objects.select_related("student"),
            ),
        )


class RoomBookingListCreateView(generics.ListCreateAPIView):
    """The logged-in student's room bookings, plus creating a new one.

    ``GET`` returns only the caller's bookings; ``POST`` attaches the booking
    to the authenticated student and adds it to the room's schedule.
    """

    serializer_class = RoomBookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        expire_past_bookings()
        return RoomBooking.objects.filter(student=self.request.user).select_related(
            "room"
        )

    def create(self, request, *args, **kwargs):
        # Only Class Representatives may book rooms.
        if not request.user.is_cr:
            return Response(
                {
                    "detail": (
                        "Only Class Representatives (CR) can book rooms. "
                        "Ask an admin to verify you as a CR."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        expire_past_bookings()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(
            RoomBookingSerializer(booking, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class RoomBookingCancelView(generics.DestroyAPIView):
    """Cancel (delete) one of the caller's bookings."""

    serializer_class = RoomBookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        expire_past_bookings()
        return RoomBooking.objects.filter(student=self.request.user)
