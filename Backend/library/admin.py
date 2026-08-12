from django.contrib import admin

from .models import Book


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "format", "status", "added_by", "updated_at"]
    list_filter = ["format", "status"]
    search_fields = ["title", "author", "isbn"]
