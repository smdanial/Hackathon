from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import FoundItem
from .serializers import FoundItemSerializer


class FoundItemListView(generics.ListCreateAPIView):
    """GET: all reported found items (newest first). POST: report one.

    Public like the rest of campus info; the form collects the finder's
    contact details, so no account is required to post.
    """

    queryset = FoundItem.objects.all()
    serializer_class = FoundItemSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Attach the reporter when a token is sent, otherwise leave null.
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(reported_by=user)
