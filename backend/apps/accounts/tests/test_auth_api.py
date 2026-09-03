from django_tenants.test.cases import TenantTestCase
from django_tenants.test.client import TenantClient

from apps.accounts.models import User


class AuthApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        self.client = TenantClient(self.tenant)
        self.user = User.objects.create_user(
            email="worker@acme.com", password="s3cret-pw", first_name="Ayşe"
        )

    def _obtain_token(self, email: str, password: str):
        return self.client.post(
            "/api/v1/auth/token/",
            {"email": email, "password": password},
            content_type="application/json",
        )

    def test_obtain_token_with_valid_credentials(self):
        response = self._obtain_token("worker@acme.com", "s3cret-pw")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())
        self.assertIn("refresh", response.json())

    def test_obtain_token_with_invalid_credentials(self):
        response = self._obtain_token("worker@acme.com", "wrong")
        self.assertEqual(response.status_code, 401)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/v1/me/")
        self.assertEqual(response.status_code, 401)

    def test_users_list_requires_auth_and_lists_active(self):
        response = self.client.get("/api/v1/users/")
        self.assertEqual(response.status_code, 401)
        User.objects.create_user(
            email="passive@acme.com", password="pw-123456", is_active=False
        )
        token = self._obtain_token("worker@acme.com", "s3cret-pw").json()["access"]
        response = self.client.get(
            "/api/v1/users/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, 200)
        emails = [user["email"] for user in response.json()]
        self.assertIn("worker@acme.com", emails)
        self.assertNotIn("passive@acme.com", emails)

    def test_me_returns_profile(self):
        token = self._obtain_token("worker@acme.com", "s3cret-pw").json()["access"]
        response = self.client.get(
            "/api/v1/me/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["email"], "worker@acme.com")
        self.assertEqual(body["role"], "member")
        self.assertEqual(body["first_name"], "Ayşe")
