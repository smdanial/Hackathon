from django.core.management.base import BaseCommand

from library.models import Book

# Same starter catalogue the Library page shipped with (frontend dummy data),
# now stored in the database. Re-running this command refreshes those nine.
STARTER_BOOKS = [
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780061120084",
        "format": "Physical",
        "status": "Taken",
        "return_date": "2026-08-18",
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "isbn": "9780451524935",
        "format": "PDF",
        "status": "Available",
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518",
        "format": "Physical",
        "status": "Available",
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "format": "PDF",
        "status": "Taken",
        "return_date": "2026-08-22",
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "isbn": "9780547928227",
        "format": "Physical",
        "status": "Available",
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "isbn": "9780590353427",
        "format": "PDF",
        "status": "Available",
    },
    {
        "title": "The Catcher in the Rye",
        "author": "J.D. Salinger",
        "isbn": "9780316769488",
        "format": "Physical",
        "status": "Taken",
        "return_date": "2026-08-25",
    },
    {
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "isbn": "9780062315007",
        "format": "PDF",
        "status": "Taken",
        "return_date": "2026-08-28",
    },
    {
        "title": "Sapiens: A Brief History of Humankind",
        "author": "Yuval Noah Harari",
        "isbn": "9780062316097",
        "format": "Physical",
        "status": "Available",
    },
]

COVER_URL = "https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg"


class Command(BaseCommand):
    help = "Seed the library with the starter book catalogue."

    def handle(self, *args, **options):
        for entry in STARTER_BOOKS:
            isbn = entry["isbn"]
            Book.objects.update_or_create(
                isbn=isbn,
                defaults={**entry, "cover_url": COVER_URL.format(isbn=isbn)},
            )
        self.stdout.write(
            self.style.SUCCESS(f"Seeded {len(STARTER_BOOKS)} books.")
        )
