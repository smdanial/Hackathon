from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Notice
from .serializers import NoticeSerializer

# Categories CRs may manage (post / update / delete), own-department only.
CR_CATEGORIES = ("class", "lab")
# Categories Club Members may manage (post / update / delete), campus-wide.
CLUB_CATEGORIES = ("club",)
# EMS notices are administration-managed only.
ADMIN_CATEGORIES = ("ems",)


def _notice_denied(category):
    if category in CLUB_CATEGORIES:
        return Response(
            {"detail": "Only Club Members can post or update Club notices."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if category in CR_CATEGORIES:
        return Response(
            {
                "detail": (
                    "Only Class Representatives (CR) can post Class and Lab "
                    "notices for their own department."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    return Response(
        {"detail": "EMS notices are managed by the administration."},
        status=status.HTTP_403_FORBIDDEN,
    )


def _can_manage(user, notice):
    """Whether ``user`` may update/delete the given notice."""
    if notice.category in CR_CATEGORIES:
        return (
            user.is_cr
            and user.department
            and notice.department == user.department
        )
    if notice.category in CLUB_CATEGORIES:
        return user.is_club_member
    return False


class NoticeListCreateView(generics.ListCreateAPIView):
    """All notices (public read) + create (role × category gated).

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
                Q(category__in=[*CLUB_CATEGORIES, *ADMIN_CATEGORIES])
                | Q(department=department)
            )
        # No department known (e.g. anonymous visitor) — only campus-wide.
        return qs.filter(category__in=[*CLUB_CATEGORIES, *ADMIN_CATEGORIES])

    def create(self, request, *args, **kwargs):
        category = str(request.data.get("category", "")).strip().lower()
        department = ""
        if category in CR_CATEGORIES:
            if not request.user.is_cr:
                return _notice_denied(category)
            if not request.user.department:
                return Response(
                    {
                        "detail": (
                            "Set your department in your profile before "
                            "posting class/lab notices."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Class/lab notices are always scoped to the poster's department.
            department = request.user.department
        elif category in CLUB_CATEGORIES:
            if not request.user.is_club_member:
                return _notice_denied(category)
        elif category in ADMIN_CATEGORIES:
            return _notice_denied(category)
        else:
            return Response(
                {"detail": "Invalid notice category."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(posted_by=request.user, department=department)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NoticeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Read a notice (public); update/delete by the category's role."""

    serializer_class = NoticeSerializer
    queryset = Notice.objects.select_related("posted_by")
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def _manage_error(self, notice):
        return _notice_denied(notice.category)

    def update(self, request, *args, **kwargs):
        notice = self.get_object()
        if not _can_manage(request.user, notice):
            return self._manage_error(notice)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        notice = self.get_object()
        if not _can_manage(request.user, notice):
            return self._manage_error(notice)
        return super().destroy(request, *args, **kwargs)
