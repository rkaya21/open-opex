from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.actions.models import Action
from apps.audits.models import Finding


class ActionApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.other = User.objects.create_user(email="other@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )

    def test_member_cannot_create_action(self):
        self.client.force_authenticate(self.member)
        response = self.client.post("/api/v1/actions/", {"title": "X"})
        self.assertEqual(response.status_code, 403)

    def test_manager_creates_action_from_finding(self):
        finding = Finding.objects.create(title="Yağ kaçağı", created_by=self.member)
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            "/api/v1/actions/",
            {
                "title": "Kaçağı gider",
                "assignee": self.member.id,
                "due_date": "2026-09-20",
                "finding": finding.id,
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["finding_title"], "Yağ kaçağı")

    def test_assignee_can_update_own_status(self):
        action = Action.objects.create(title="İş", assignee=self.member)
        self.client.force_authenticate(self.member)
        response = self.client.patch(
            f"/api/v1/actions/{action.id}/", {"status": "done"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "done")
        self.assertIsNotNone(response.json()["completed_at"])

    def test_assignee_cannot_change_other_fields(self):
        action = Action.objects.create(title="İş", assignee=self.member)
        self.client.force_authenticate(self.member)
        response = self.client.patch(
            f"/api/v1/actions/{action.id}/", {"title": "Değişti"}
        )
        self.assertEqual(response.status_code, 403)

    def test_non_assignee_cannot_update(self):
        action = Action.objects.create(title="İş", assignee=self.member)
        self.client.force_authenticate(self.other)
        response = self.client.patch(
            f"/api/v1/actions/{action.id}/", {"status": "done"}
        )
        self.assertEqual(response.status_code, 403)

    def test_reopening_clears_completed_at(self):
        action = Action.objects.create(title="İş", assignee=self.member)
        self.client.force_authenticate(self.manager)
        self.client.patch(f"/api/v1/actions/{action.id}/", {"status": "done"})
        response = self.client.patch(
            f"/api/v1/actions/{action.id}/", {"status": "open"}
        )
        self.assertIsNone(response.json()["completed_at"])

    def test_mine_filter(self):
        Action.objects.create(title="Benim", assignee=self.member)
        Action.objects.create(title="Başkasının", assignee=self.other)
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/actions/?mine=true")
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["title"], "Benim")
