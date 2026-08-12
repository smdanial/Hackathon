"""URL configuration for campusease project."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/rooms/', include('rooms.urls')),
    path('api/lost-found/', include('lostfound.urls')),
    path('api/notices/', include('notices.urls')),
    path('api/library/', include('library.urls')),
]

# Serve uploaded media (profile pictures) in development.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
