from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User


class OnePointLessonApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.other = User.objects.create_user(email="other@acme.com", password="pw-123456")
        self.third = User.objects.create_user(email="third@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )

    def _payload(self, **overrides):
        data = {
            "category": "quality",
            "topic": "Vinç kancası güvenli kullanımı",
            "content": "Kanca kilidi kontrolü ve yük bağlama kuralları.",
            "held_at": "2026-09-04T14:55:00Z",
            "duration_minutes": 15,
            "participants": [self.member.id, self.other.id, self.third.id],
        }
        data.update(overrides)
        return data

    def test_member_creates_lesson_trainer_defaults_to_creator(self):
        self.client.force_authenticate(self.member)
        response = self.client.post("/api/v1/lessons/", self._payload(), format="json")
        self.assertEqual(response.status_code, 201, response.json())
        body = response.json()
        self.assertEqual(body["trainer_email"], "worker@acme.com")
        self.assertEqual(body["category_label"], "Kalite")
        self.assertEqual(len(body["participant_emails"]), 3)

    def test_explicit_trainer_is_kept(self):
        self.client.force_authenticate(self.member)
        response = self.client.post(
            "/api/v1/lessons/", self._payload(trainer=self.manager.id), format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["trainer_email"], "lead@acme.com")

    def test_minimum_three_participants_enforced(self):
        self.client.force_authenticate(self.member)
        response = self.client.post(
            "/api/v1/lessons/",
            self._payload(participants=[self.member.id, self.other.id]),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("participants", response.json())

    def test_other_member_cannot_edit(self):
        self.client.force_authenticate(self.member)
        lesson_id = self.client.post(
            "/api/v1/lessons/", self._payload(), format="json"
        ).json()["id"]
        self.client.force_authenticate(self.other)
        response = self.client.patch(
            f"/api/v1/lessons/{lesson_id}/", {"topic": "Değişti"}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_manager_can_edit_any(self):
        self.client.force_authenticate(self.member)
        lesson_id = self.client.post(
            "/api/v1/lessons/", self._payload(), format="json"
        ).json()["id"]
        self.client.force_authenticate(self.manager)
        response = self.client.patch(
            f"/api/v1/lessons/{lesson_id}/", {"topic": "Revize"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["topic"], "Revize")

    def test_filter_by_category(self):
        self.client.force_authenticate(self.member)
        self.client.post("/api/v1/lessons/", self._payload(), format="json")
        self.client.post(
            "/api/v1/lessons/",
            self._payload(category="kaizen", topic="Kaizen örneği"),
            format="json",
        )
        response = self.client.get("/api/v1/lessons/?category=kaizen")
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["topic"], "Kaizen örneği")

    def test_list_requires_auth(self):
        response = self.client.get("/api/v1/lessons/")
        self.assertEqual(response.status_code, 401)
