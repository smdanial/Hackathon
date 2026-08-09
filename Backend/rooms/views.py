from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Room
from .serializers import RoomSerializer


class RoomListView(generics.ListAPIView):
    """All rooms with their schedules (public campus info)."""

    queryset = Room.objects.prefetch_related("schedule")
    serializer_class = RoomSerializer
    permission_classes = [AllowAny]


class RoomDetailView(generics.RetrieveAPIView):
    """A single room with its schedule."""

    queryset = Room.objects.prefetch_related("schedule")
    serializer_class = RoomSerializer
    permission_classes = [AllowAny]
