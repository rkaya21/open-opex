from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.actions.models import Action
from apps.audits.models import Area, Audit, ChecklistTemplate
from apps.improvements.models import ImprovementProject, Suggestion


class MyWorkTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )

    def test_member_buckets(self):
        Action.objects.create(title="Bana atanan", assignee=self.member)
        Action.objects.create(
            title="Bitmiş", assignee=self.member, status=Action.Status.DONE
        )
        area = Area.objects.create(name="Montaj", code="SAHA-01")
        template = ChecklistTemplate.objects.create(name="5S")
        Audit.objects.create(
            template=template, area=area, auditor=self.member, scheduled_date="2026-09-10"
        )
        Suggestion.objects.create(
            title="Fikrim", description="...", submitted_by=self.member
        )
        ImprovementProject.objects.create(title="Liderliğim", lead=self.member)

        self.client.force_authenticate(self.member)
        body = self.client.get("/api/v1/my-work/").json()
        self.assertEqual(len(body["actions"]), 1)  # done excluded
        self.assertEqual(len(body["audits"]), 1)
        self.assertEqual(len(body["suggestions"]), 1)
        self.assertEqual(len(body["projects"]), 1)
        self.assertNotIn("suggestions_to_evaluate", body)

    def test_manager_sees_suggestions_to_evaluate(self):
        Suggestion.objects.create(
            title="Fikir", description="...", submitted_by=self.member
        )
        self.client.force_authenticate(self.manager)
        body = self.client.get("/api/v1/my-work/").json()
        self.assertEqual(len(body["suggestions_to_evaluate"]), 1)

    def test_requires_auth(self):
        response = self.client.get("/api/v1/my-work/")
        self.assertEqual(response.status_code, 401)
