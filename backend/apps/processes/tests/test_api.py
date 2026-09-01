from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.processes.models import Process


class ProcessApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )
        self.root = Process.objects.create(name="Production", code="PR-001")

    def test_list_requires_authentication(self):
        response = self.client.get("/api/v1/processes/")
        self.assertEqual(response.status_code, 401)

    def test_member_can_list(self):
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/processes/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)

    def test_member_cannot_create(self):
        self.client.force_authenticate(self.member)
        response = self.client.post("/api/v1/processes/", {"name": "X", "code": "PR-100"})
        self.assertEqual(response.status_code, 403)

    def test_member_cannot_publish_or_archive(self):
        self.client.force_authenticate(self.member)
        publish = self.client.post(f"/api/v1/processes/{self.root.id}/publish/")
        archive = self.client.post(f"/api/v1/processes/{self.root.id}/archive/")
        self.assertEqual(publish.status_code, 403)
        self.assertEqual(archive.status_code, 403)

    def test_manager_can_create_subprocess(self):
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            "/api/v1/processes/",
            {"name": "Assembly", "code": "PR-002", "parent": self.root.id},
        )
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["status"], "draft")
        self.assertEqual(body["parent"], self.root.id)

    def test_duplicate_code_rejected(self):
        self.client.force_authenticate(self.manager)
        response = self.client.post("/api/v1/processes/", {"name": "Dup", "code": "PR-001"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("code", response.json())

    def test_cycle_rejected_via_api(self):
        child = Process.objects.create(name="Assembly", code="PR-002", parent=self.root)
        self.client.force_authenticate(self.manager)
        response = self.client.patch(
            f"/api/v1/processes/{self.root.id}/", {"parent": child.id}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("parent", response.json())

    def test_publish_and_version_bump(self):
        self.client.force_authenticate(self.manager)
        first = self.client.post(f"/api/v1/processes/{self.root.id}/publish/")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json()["status"], "published")
        self.assertEqual(first.json()["version"], 1)
        second = self.client.post(f"/api/v1/processes/{self.root.id}/publish/")
        self.assertEqual(second.json()["version"], 2)

    def test_published_process_cannot_be_deleted(self):
        self.root.publish()
        self.client.force_authenticate(self.manager)
        response = self.client.delete(f"/api/v1/processes/{self.root.id}/")
        self.assertEqual(response.status_code, 400)

    def test_draft_process_can_be_deleted(self):
        draft = Process.objects.create(name="Temp", code="PR-099")
        self.client.force_authenticate(self.manager)
        response = self.client.delete(f"/api/v1/processes/{draft.id}/")
        self.assertEqual(response.status_code, 204)

    def test_tree_returns_hierarchy(self):
        child = Process.objects.create(name="Assembly", code="PR-002", parent=self.root)
        Process.objects.create(name="Welding", code="PR-003", parent=child)
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/processes/tree/")
        self.assertEqual(response.status_code, 200)
        tree = response.json()
        self.assertEqual(len(tree), 1)
        self.assertEqual(tree[0]["code"], "PR-001")
        self.assertEqual(tree[0]["children"][0]["code"], "PR-002")
        self.assertEqual(tree[0]["children"][0]["children"][0]["code"], "PR-003")

    def test_tree_supports_deep_hierarchy(self):
        parent = self.root
        for level in range(2, 7):  # 6 levels deep
            parent = Process.objects.create(
                name=f"Level {level}", code=f"PR-00{level}", parent=parent
            )
        self.client.force_authenticate(self.member)
        node = self.client.get("/api/v1/processes/tree/").json()[0]
        depth = 1
        while node["children"]:
            node = node["children"][0]
            depth += 1
        self.assertEqual(depth, 6)

    def test_filter_by_status(self):
        Process.objects.create(name="Old", code="PR-090", status=Process.Status.ARCHIVED)
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/processes/?status=archived")
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["code"], "PR-090")

    def test_search_by_name(self):
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/processes/?search=Produc")
        self.assertEqual(response.json()["count"], 1)
