from django.urls import path

from . import views

urlpatterns = [
    path("", views.LabReportListCreateView.as_view(), name="labreport-list"),
    # Must stay before <int:pk>/ so "pdf" isn't parsed as a pk.
    path("pdf/", views.LabReportPdfView.as_view(), name="labreport-pdf"),
    path("<int:pk>/", views.LabReportDetailView.as_view(), name="labreport-detail"),
]
