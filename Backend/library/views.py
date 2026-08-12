from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Book
from .serializers import BookSerializer


def _librarian_denied():
    return Response(
        {"detail": "Only Librarians can manage the library's book list."},
        status=status.HTTP_403_FORBIDDEN,
    )


class BookListCreateView(generics.ListCreateAPIView):
    """GET: browse the book catalogue (public read). POST: add a book.

    Adding books — including uploading PDFs — is restricted to Librarians;
    anyone else gets 403.
    """

    queryset = Book.objects.select_related("added_by")
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        if not request.user.is_librarian:
            return _librarian_denied()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(added_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET: read one book. PATCH/DELETE: update or remove it (Librarian only)."""

    queryset = Book.objects.select_related("added_by")
    serializer_class = BookSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def update(self, request, *args, **kwargs):
        if not request.user.is_librarian:
            return _librarian_denied()
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_librarian:
            return _librarian_denied()
        return super().destroy(request, *args, **kwargs)
