from django.urls import path

from . import views

urlpatterns = [
    path(
        "update-location/",
        views.UpdateLocationView.as_view(),
        name="bus-update-location",
    ),
    path("stop-sharing/", views.StopSharingView.as_view(), name="bus-stop-sharing"),
    path(
        "location/<str:route>/",
        views.BusLocationDetailView.as_view(),
        name="bus-location",
    ),
]
