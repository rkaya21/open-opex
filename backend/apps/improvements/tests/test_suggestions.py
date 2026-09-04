from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.improvements.models import Suggestion


class SuggestionApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.other = User.objects.create_user(email="other@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )

    def _submit(self, user=None) -> int:
        self.client.force_authenticate(user or self.member)
        response = self.client.post(
            "/api/v1/suggestions/",
            {"title": "Daha kısa setup", "description": "Kalıp değişimini SMED ile kısaltalım."},
        )
        assert response.status_code == 201, response.json()
        return response.json()["id"]

    def test_member_can_submit(self):
        suggestion_id = self._submit()
        suggestion = Suggestion.objects.get(id=suggestion_id)
        self.assertEqual(suggestion.status, Suggestion.Status.SUBMITTED)
        self.assertEqual(suggestion.submitted_by, self.member)

    def test_submitter_can_edit_own_while_submitted(self):
        suggestion_id = self._submit()
        response = self.client.patch(
            f"/api/v1/suggestions/{suggestion_id}/", {"title": "Güncel başlık"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Güncel başlık")

    def test_other_member_cannot_edit(self):
        suggestion_id = self._submit()
        self.client.force_authenticate(self.other)
        response = self.client.patch(
            f"/api/v1/suggestions/{suggestion_id}/", {"title": "Hack"}
        )
        self.assertEqual(response.status_code, 403)

    def test_member_cannot_approve(self):
        suggestion_id = self._submit()
        response = self.client.post(f"/api/v1/suggestions/{suggestion_id}/approve/")
        self.assertEqual(response.status_code, 403)

    def test_manager_approves_with_note(self):
        suggestion_id = self._submit()
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            f"/api/v1/suggestions/{suggestion_id}/approve/", {"note": "Güzel fikir"}
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "approved")
        self.assertEqual(body["evaluation_note"], "Güzel fikir")
        self.assertIsNotNone(body["evaluated_at"])

    def test_evaluated_suggestion_cannot_be_edited_by_submitter(self):
        suggestion_id = self._submit()
        self.client.force_authenticate(self.manager)
        self.client.post(f"/api/v1/suggestions/{suggestion_id}/approve/")
        self.client.force_authenticate(self.member)
        response = self.client.patch(
            f"/api/v1/suggestions/{suggestion_id}/", {"title": "Değişiklik"}
        )
        self.assertEqual(response.status_code, 403)

    def test_reject_flow(self):
        suggestion_id = self._submit()
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            f"/api/v1/suggestions/{suggestion_id}/reject/", {"note": "Bütçe yok"}
        )
        self.assertEqual(response.json()["status"], "rejected")

    def test_cannot_evaluate_twice(self):
        suggestion_id = self._submit()
        self.client.force_authenticate(self.manager)
        self.client.post(f"/api/v1/suggestions/{suggestion_id}/approve/")
        response = self.client.post(f"/api/v1/suggestions/{suggestion_id}/reject/")
        self.assertEqual(response.status_code, 400)

    def test_implement_requires_approved(self):
        suggestion_id = self._submit()
        self.client.force_authenticate(self.manager)
        response = self.client.post(f"/api/v1/suggestions/{suggestion_id}/implement/")
        self.assertEqual(response.status_code, 400)

    def test_implement_flow(self):
        suggestion_id = self._submit()
        self.client.force_authenticate(self.manager)
        self.client.post(f"/api/v1/suggestions/{suggestion_id}/approve/")
        response = self.client.post(f"/api/v1/suggestions/{suggestion_id}/implement/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "implemented")
        self.assertIsNotNone(response.json()["implemented_at"])

    def test_full_idea_form_roundtrip(self):
        self.client.force_authenticate(self.member)
        response = self.client.post(
            "/api/v1/suggestions/",
            {
                "title": "LED armatür dönüşümü",
                "category": "sec",
                "problem": "Mevcut aydınlatma yetersiz ve enerji tüketimi yüksek.",
                "solution": "Tüm armatürler LED ile değiştirilsin.",
                "estimated_cost": "12000",
                "estimated_benefit": "30000",
                "benefit_note": "Yıllık enerji tasarrufu",
            },
        )
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["category"], "sec")
        self.assertEqual(body["solution"], "Tüm armatürler LED ile değiştirilsin.")
        self.assertEqual(body["estimated_benefit"], "30000.00")

    def test_filter_by_category(self):
        self._submit()
        self.client.force_authenticate(self.member)
        self.client.post(
            "/api/v1/suggestions/",
            {"title": "SEÇ fikri", "category": "sec", "problem": "x", "solution": "y"},
        )
        response = self.client.get("/api/v1/suggestions/?category=sec")
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["title"], "SEÇ fikri")

    def test_filter_by_status(self):
        self._submit()
        approved_id = self._submit(self.other)
        self.client.force_authenticate(self.manager)
        self.client.post(f"/api/v1/suggestions/{approved_id}/approve/")
        response = self.client.get("/api/v1/suggestions/?status=approved")
        self.assertEqual(response.json()["count"], 1)
