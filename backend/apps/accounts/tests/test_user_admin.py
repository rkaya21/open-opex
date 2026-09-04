from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User


class UserAdminApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.admin = User.objects.create_superuser(email="admin@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")

    def test_non_admin_cannot_access(self):
        for user in (self.manager, self.member):
            self.client.force_authenticate(user)
            response = self.client.get("/api/v1/manage/users/")
            self.assertEqual(response.status_code, 403)

    def test_admin_lists_all_users(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/v1/manage/users/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)

    def test_admin_creates_user_with_role(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/manage/users/",
            {"email": "new@acme.com", "password": "guclu-sifre-42", "role": "manager"},
        )
        self.assertEqual(response.status_code, 201)
        created = User.objects.get(email="new@acme.com")
        self.assertEqual(created.role, User.Role.MANAGER)
        self.assertTrue(created.check_password("guclu-sifre-42"))
        self.assertNotIn("password", response.json())

    def test_weak_password_rejected(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/manage/users/",
            {"email": "new@acme.com", "password": "123", "role": "member"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json())

    def test_create_without_password_rejected(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/manage/users/", {"email": "new@acme.com", "role": "member"}
        )
        self.assertEqual(response.status_code, 400)

    def test_admin_changes_role_and_deactivates(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f"/api/v1/manage/users/{self.member.id}/",
            {"role": "manager", "is_active": False},
        )
        self.assertEqual(response.status_code, 200)
        self.member.refresh_from_db()
        self.assertEqual(self.member.role, User.Role.MANAGER)
        self.assertFalse(self.member.is_active)

    def test_admin_cannot_demote_or_deactivate_self(self):
        self.client.force_authenticate(self.admin)
        demote = self.client.patch(
            f"/api/v1/manage/users/{self.admin.id}/", {"role": "member"}
        )
        deactivate = self.client.patch(
            f"/api/v1/manage/users/{self.admin.id}/", {"is_active": False}
        )
        self.assertEqual(demote.status_code, 403)
        self.assertEqual(deactivate.status_code, 403)

    def test_admin_resets_password(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f"/api/v1/manage/users/{self.member.id}/", {"password": "yeni-sifre-42"}
        )
        self.assertEqual(response.status_code, 200)
        self.member.refresh_from_db()
        self.assertTrue(self.member.check_password("yeni-sifre-42"))

    def test_delete_not_allowed(self):
        self.client.force_authenticate(self.admin)
        response = self.client.delete(f"/api/v1/manage/users/{self.member.id}/")
        self.assertEqual(response.status_code, 405)
