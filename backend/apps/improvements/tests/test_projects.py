from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.improvements.models import ImprovementProject, Suggestion


class ImprovementProjectApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )

    def test_member_cannot_create_project(self):
        self.client.force_authenticate(self.member)
        response = self.client.post("/api/v1/projects/", {"title": "X"})
        self.assertEqual(response.status_code, 403)

    def test_manager_creates_project_with_a3(self):
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            "/api/v1/projects/",
            {
                "title": "Setup süresini azalt",
                "a3_background": "Kalıp değişimi 45 dk sürüyor",
                "a3_goal": "20 dk altına inmek",
                "expected_benefit": "150000",
            },
        )
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["phase"], "plan")
        self.assertEqual(body["a3_goal"], "20 dk altına inmek")

    def test_member_can_read_projects(self):
        ImprovementProject.objects.create(title="Proje")
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/projects/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)

    def test_advance_through_pdca_phases(self):
        project = ImprovementProject.objects.create(title="Proje")
        self.client.force_authenticate(self.manager)
        phases = []
        for _ in range(4):
            response = self.client.post(f"/api/v1/projects/{project.id}/advance/")
            phases.append(response.json()["phase"])
        self.assertEqual(phases, ["do", "check", "act", "done"])
        response = self.client.post(f"/api/v1/projects/{project.id}/advance/")
        self.assertEqual(response.status_code, 400)  # already done

    def test_member_cannot_advance(self):
        project = ImprovementProject.objects.create(title="Proje")
        self.client.force_authenticate(self.member)
        response = self.client.post(f"/api/v1/projects/{project.id}/advance/")
        self.assertEqual(response.status_code, 403)

    def test_project_links_suggestion(self):
        suggestion = Suggestion.objects.create(
            title="Fikir", description="Detay", submitted_by=self.member
        )
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            "/api/v1/projects/", {"title": "Fikirden proje", "suggestion": suggestion.id}
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["suggestion_title"], "Fikir")

    def test_filter_by_phase(self):
        ImprovementProject.objects.create(title="Planda")
        ImprovementProject.objects.create(
            title="Bitti", phase=ImprovementProject.Phase.DONE
        )
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/projects/?phase=done")
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["title"], "Bitti")
