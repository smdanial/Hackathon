from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Notice
from .serializers import NoticeSerializer

# Categories CRs may manage (post / update / delete).
MANAGEABLE_CATEGORIES = ("class", "lab")


class NoticeListCreateView(generics.ListCreateAPIView):
    """All notices (public read) + create (CR only, own department).

    Club/EMS notices are campus-wide; Class/Lab notices are department-scoped
    and only returned for the viewer's own department (via ``?department=``,
    sent by the frontend from the signed-in student's profile).
    """

    serializer_class = NoticeSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Notice.objects.select_related("posted_by")
        department = self.request.query_params.get("department", "").strip()
        if department:
            # Campus-wide notices + this department's class/lab notices.
            return qs.filter(
                Q(category__in=["club", "ems"]) | Q(department=department)
            )
        # No department known (e.g. anonymous visitor) — only campus-wide.
        return qs.filter(category__in=["club", "ems"])

    def create(self, request, *args, **kwargs):
        if not request.user.is_cr:
            return Response(
                {"detail": "Only Class Representatives (CR) can post notices."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not request.user.department:
            return Response(
                {
                    "detail": (
                        "Set your department in your profile before posting "
                        "class/lab notices."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Class/lab notices are always scoped to the poster's own department.
        serializer.save(
            posted_by=request.user, department=request.user.department
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NoticeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Read a notice (public); update/delete by a CR of the same department."""

    serializer_class = NoticeSerializer
    queryset = Notice.objects.select_related("posted_by")
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def _manage_error(self):
        return Response(
            {
                "detail": (
                    "Only Class Representatives (CR) can update Class and Lab "
                    "notices for their own department."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    def update(self, request, *args, **kwargs):
        notice = self.get_object()
        if (
            not request.user.is_cr
            or not request.user.department
            or notice.category not in MANAGEABLE_CATEGORIES
            or notice.department != request.user.department
        ):
            return self._manage_error()
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        notice = self.get_object()
        if (
            not request.user.is_cr
            or not request.user.department
            or notice.category not in MANAGEABLE_CATEGORIES
            or notice.department != request.user.department
        ):
            return self._manage_error()
        return super().destroy(request, *args, **kwargs)
