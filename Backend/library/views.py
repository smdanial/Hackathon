from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Book
from .serializers import BookSerializer


def _manage_denied():
    return Response(
        {
            "detail": (
                "Only Librarians can manage campus-wide books, and only the "
                "CR of a department can manage that department's books."
            )
        },
        status=status.HTTP_403_FORBIDDEN,
    )


def _can_manage(user, book):
    """Whether ``user`` may update/delete the given book.

    Campus-wide books (blank department) are Librarian-only. Department books
    can be managed by that department's CR or by a Librarian.
    """
    if book.department:
        return user.is_librarian or (
            user.is_cr and user.department == book.department
        )
    return user.is_librarian


class BookListCreateView(generics.ListCreateAPIView):
    """GET: browse the book catalogue. POST: add a book.

    Reads are department-scoped via ``?department=``: when the query param is
    present (even empty), only campus-wide books plus that department's CR
    uploads are returned; without it the full catalogue is returned (used by
    Librarians). Adding books is restricted to Librarians (any department or
    campus-wide) and CRs (their own department only — never one from the
    body, to prevent spoofing).
    """

    queryset = Book.objects.select_related("added_by")
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        # Only filter when the param is *present* — an absent param means the
        # caller wants the full catalogue (Librarians).
        if "department" in self.request.query_params:
            department = self.request.query_params.get("department", "").strip()
            return qs.filter(Q(department="") | Q(department=department))
        return qs

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.is_librarian:
            # Librarians may post campus-wide books or scope them to a
            # department. The serializer validates the choice list.
            department = str(request.data.get("department", "")).strip()
        elif user.is_cr:
            if not user.department:
                return Response(
                    {
                        "detail": (
                            "Set your department in your profile before "
                            "uploading department books."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # CR uploads are always scoped to the poster's department —
            # never one taken from the request body.
            department = user.department
        else:
            return _manage_denied()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(added_by=user, department=department)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET: read one book. PATCH/DELETE: update or remove it (role gated)."""

    queryset = Book.objects.select_related("added_by")
    serializer_class = BookSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def update(self, request, *args, **kwargs):
        book = self.get_object()
        if not _can_manage(request.user, book):
            return _manage_denied()
        # A CR editing their department's book cannot move it to another
        # department (or make it campus-wide); only Librarians may re-scope.
        if not request.user.is_librarian:
            serializer = self.get_serializer(
                book, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save(department=book.department)
            return Response(serializer.data)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        book = self.get_object()
        if not _can_manage(request.user, book):
            return _manage_denied()
        return super().destroy(request, *args, **kwargs)
