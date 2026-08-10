from django.urls import path

from . import views

urlpatterns = [
    path("", views.NoticeListCreateView.as_view(), name="notice-list"),
    path("<int:pk>/", views.NoticeDetailView.as_view(), name="notice-detail"),
]
