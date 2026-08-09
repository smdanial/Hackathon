"""Seed the database with the starter found-item posts.

The data mirrors the frontend's original mock posts
(`Frontend/components/lost-found/dummyData.ts`) and the photos live in
``media/lost_found/``, so the Lost tab looks identical once connected to
the API. Idempotent: re-running updates existing posts instead of
duplicating them (matched by item name + finder name).

Usage: python manage.py seed_found_items
"""

from django.core.management.base import BaseCommand

from lostfound.models import FoundItem


ITEMS = [
    {
        "item_name": "Notebook",
        "category": FoundItem.Category.DOCUMENTS,
        "description": (
            "Green spiral-bound notebook with math notes inside, a little "
            "worn at the corners."
        ),
        "location_found": "Library entrance",
        "image": "lost_found/notebook.jpeg",
        "finder_name": "Akash",
        "finder_phone": "01712-345678",
        "date_posted": "2026-08-06",
    },
    {
        "item_name": "Phone",
        "category": FoundItem.Category.ELECTRONICS,
        "description": (
            "Black smartphone with a cracked screen protector, left on a "
            "canteen table."
        ),
        "location_found": "Canteen",
        "image": "lost_found/phone.jpeg",
        "finder_name": "Danial",
        "finder_phone": "01815-223344",
        "date_posted": "2026-08-05",
    },
    {
        "item_name": "Calculator",
        "category": FoundItem.Category.ELECTRONICS,
        "description": "Casio scientific calculator found in Room 203 after the 2pm class.",
        "location_found": "Room 203",
        "image": "lost_found/calculator.jpeg",
        "finder_name": "Sojib",
        "finder_phone": "01911-998877",
        "date_posted": "2026-08-04",
    },
]


class Command(BaseCommand):
    help = "Seed starter found-item posts (idempotent; mirrors the frontend mock)."

    def handle(self, *args, **options):
        created = 0
        for data in ITEMS:
            data = dict(data)
            item, was_created = FoundItem.objects.update_or_create(
                item_name=data.pop("item_name"),
                finder_name=data.pop("finder_name"),
                defaults=data,
            )
            if was_created:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created} new posts; {FoundItem.objects.count()} found items total."
            )
        )
