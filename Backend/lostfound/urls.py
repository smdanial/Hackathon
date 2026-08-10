from django.urls import path

from . import views

urlpatterns = [
    path("", views.FoundItemListView.as_view(), name="found-item-list"),
    path(
        "<int:pk>/received/",
        views.FoundItemReceivedView.as_view(),
        name="found-item-received",
    ),
]
