from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import BusLocation


def _student(**overrides):
    """Create a student account (role/route overridable) with an auth token.

    The custom Student model has no username, so accounts are built directly
    (same path as the signup serializer) rather than via create_user.
    """
    Student = get_user_model()
    email = overrides.pop("email", f"user{Student.objects.count()}@student.edu")
    student = Student(
        email=email,
        full_name="Test Student",
        student_id=overrides.pop(
            "student_id", f"NIT-{Student.objects.count()}"
        ),
        **overrides,
    )
    student.set_password("hackathon123")
    student.save()
    token, _ = Token.objects.get_or_create(user=student)
    return student, token.key


class BusLocationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_driver_updates_location_on_assigned_route(self):
        _, token = _student(role="driver", assigned_route="farmgate")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        # Even if the payload claims another route, it lands on the assigned one.
        resp = self.client.post(
            "/api/bus/update-location/",
            {"latitude": 23.7725, "longitude": 90.3735, "route": "uttara"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["route"], "farmgate")
        self.assertTrue(resp.data["is_active"])
        location = BusLocation.objects.get(route="farmgate")
        self.assertEqual(location.latitude, 23.7725)
        self.assertEqual(location.longitude, 90.3735)

    def test_student_cannot_update_location(self):
        _, token = _student()  # plain student
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.post(
            "/api/bus/update-location/",
            {"latitude": 23.7, "longitude": 90.3},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_student_reads_any_route(self):
        BusLocation.objects.create(
            route="uttara", latitude=23.867, longitude=90.36
        )
        _, token = _student()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.get("/api/bus/location/uttara/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["route"], "uttara")
        self.assertTrue(resp.data["is_active"])

    def test_known_route_without_fix_returns_offline(self):
        _, token = _student()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.get("/api/bus/location/farmgate/")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data["is_active"])
        self.assertIsNone(resp.data["latitude"])

    def test_retired_route_is_not_found(self):
        # Gabtoli was removed from the campus routes.
        _, token = _student()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.get("/api/bus/location/gabtoli/")
        self.assertEqual(resp.status_code, 404)

    def test_anonymous_read_is_rejected(self):
        resp = self.client.get("/api/bus/location/farmgate/")
        self.assertEqual(resp.status_code, 401)

    def test_stop_sharing_marks_route_inactive(self):
        BusLocation.objects.create(
            route="farmgate", latitude=23.77, longitude=90.37
        )
        _, token = _student(role="driver", assigned_route="farmgate")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.post("/api/bus/stop-sharing/")
        self.assertEqual(resp.status_code, 200)
        location = BusLocation.objects.get(route="farmgate")
        self.assertFalse(location.is_active)

    def test_invalid_coordinates_rejected(self):
        _, token = _student(role="driver", assigned_route="farmgate")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        resp = self.client.post(
            "/api/bus/update-location/",
            {"latitude": "not-a-number", "longitude": 90.3},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
