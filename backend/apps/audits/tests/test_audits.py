from django.core.management import call_command
from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.audits.models import Area, Audit, ChecklistItem, ChecklistTemplate


class AuditFlowTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )
        self.area = Area.objects.create(name="Montaj Sahası", code="SAHA-01")
        self.template = ChecklistTemplate.objects.create(name="Test Denetimi")
        self.items = [
            ChecklistItem.objects.create(template=self.template, text=f"Soru {i}", order=i)
            for i in range(4)
        ]
        self.audit = Audit.objects.create(
            template=self.template,
            area=self.area,
            auditor=self.member,
            scheduled_date="2026-09-10",
        )

    def _answer_all(self, scores: list[int]):
        payload = [
            {"item": item.id, "score": score}
            for item, score in zip(self.items, scores, strict=True)
        ]
        return self.client.put(
            f"/api/v1/audits/{self.audit.id}/answers/", payload, format="json"
        )

    def test_member_cannot_schedule_audit(self):
        self.client.force_authenticate(self.member)
        response = self.client.post(
            "/api/v1/audits/",
            {"template": self.template.id, "area": self.area.id, "scheduled_date": "2026-09-11"},
        )
        self.assertEqual(response.status_code, 403)

    def test_member_auditor_can_answer_and_complete(self):
        self.client.force_authenticate(self.member)
        response = self._answer_all([5, 4, 3, 4])
        self.assertEqual(response.status_code, 200)
        complete = self.client.post(f"/api/v1/audits/{self.audit.id}/complete/")
        self.assertEqual(complete.status_code, 200)
        body = complete.json()
        self.assertEqual(body["status"], "completed")
        self.assertEqual(body["score_percent"], "80.0")  # 16/20

    def test_cannot_complete_with_missing_answers(self):
        self.client.force_authenticate(self.member)
        self.client.put(
            f"/api/v1/audits/{self.audit.id}/answers/",
            [{"item": self.items[0].id, "score": 5}],
            format="json",
        )
        response = self.client.post(f"/api/v1/audits/{self.audit.id}/complete/")
        self.assertEqual(response.status_code, 400)

    def test_answers_are_idempotent(self):
        self.client.force_authenticate(self.member)
        self._answer_all([5, 5, 5, 5])
        self._answer_all([1, 1, 1, 1])
        self.client.post(f"/api/v1/audits/{self.audit.id}/complete/")
        self.audit.refresh_from_db()
        self.assertEqual(str(self.audit.score_percent), "20.0")

    def test_foreign_item_rejected(self):
        other_template = ChecklistTemplate.objects.create(name="Başka")
        foreign = ChecklistItem.objects.create(template=other_template, text="X")
        self.client.force_authenticate(self.member)
        response = self.client.put(
            f"/api/v1/audits/{self.audit.id}/answers/",
            [{"item": foreign.id, "score": 3}],
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_completed_audit_is_frozen(self):
        self.client.force_authenticate(self.member)
        self._answer_all([5, 5, 5, 5])
        self.client.post(f"/api/v1/audits/{self.audit.id}/complete/")
        response = self._answer_all([1, 1, 1, 1])
        self.assertEqual(response.status_code, 400)
        second_complete = self.client.post(f"/api/v1/audits/{self.audit.id}/complete/")
        self.assertEqual(second_complete.status_code, 400)

    def test_area_last_score_surfaces(self):
        self.client.force_authenticate(self.member)
        self._answer_all([4, 4, 4, 4])
        self.client.post(f"/api/v1/audits/{self.audit.id}/complete/")
        response = self.client.get(f"/api/v1/areas/{self.area.id}/")
        self.assertEqual(response.json()["last_score"], "80.0")

    def test_seed_5s_checklist_idempotent(self):
        call_command("seed_5s_checklist")
        call_command("seed_5s_checklist")
        template = ChecklistTemplate.objects.get(name="5S Denetimi")
        self.assertEqual(template.items.count(), 10)

    def test_template_create_with_items(self):
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            "/api/v1/checklists/",
            {
                "name": "Güvenlik Turu",
                "items": [
                    {"text": "KKD kullanımı tam", "category": "İSG"},
                    {"text": "Acil çıkışlar açık", "category": "İSG"},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()["items"]), 2)
