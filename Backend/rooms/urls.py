from django.urls import path

from . import views

urlpatterns = [
    path("", views.RoomListView.as_view(), name="room-list"),
    path("<int:pk>/", views.RoomDetailView.as_view(), name="room-detail"),
    path("bookings/", views.RoomBookingListCreateView.as_view(), name="room-booking-list"),
    path(
        "bookings/<int:pk>/",
        views.RoomBookingCancelView.as_view(),
        name="room-booking-cancel",
    ),
]
