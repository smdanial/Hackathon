from django.contrib import admin

from .models import Book


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "author",
        "format",
        "status",
        "department",
        "added_by",
        "updated_at",
    ]
    list_filter = ["format", "status", "department"]
    search_fields = ["title", "author", "isbn"]
