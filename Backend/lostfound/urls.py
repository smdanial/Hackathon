from django.urls import path

from . import views

urlpatterns = [
    path("", views.FoundItemListView.as_view(), name="found-item-list"),
]
