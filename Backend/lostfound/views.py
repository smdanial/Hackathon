from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FoundItem
from .serializers import FoundItemSerializer


class FoundItemListView(generics.ListCreateAPIView):
    """GET: all reported found items. POST: report one.

    Sign-in is required for both — nothing in Lost & Found is visible or
    postable without an account.
    """

    queryset = FoundItem.objects.all()
    serializer_class = FoundItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class FoundItemReceivedView(APIView):
    """Mark a found item as received.

    Only the student who reported the item may do this; anyone else gets
    403. The flag is one-way (received stays received).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        item = get_object_or_404(FoundItem, pk=pk)
        if item.reported_by_id != request.user.id:
            raise PermissionDenied(
                "Only the student who reported this item can mark it as received."
            )
        item.is_received = True
        item.received_at = timezone.now()
        item.save(update_fields=["is_received", "received_at"])
        return Response(
            FoundItemSerializer(item, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
