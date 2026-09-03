import io

from django.core.files.uploadedfile import SimpleUploadedFile
from django_tenants.test.cases import TenantTestCase
from PIL import Image
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.audits.models import Area, Finding


def _png() -> SimpleUploadedFile:
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), "red").save(buffer, format="PNG")
    return SimpleUploadedFile("photo.png", buffer.getvalue(), content_type="image/png")


class FindingApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )
        self.area = Area.objects.create(name="Montaj", code="SAHA-01")

    def test_member_creates_finding_with_photo(self):
        self.client.force_authenticate(self.member)
        response = self.client.post(
            "/api/v1/findings/",
            {"title": "Yağ kaçağı", "area": self.area.id, "photo": _png()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["status"], "open")
        # Media must be segregated per tenant schema on disk
        self.assertIn(f"findings/{self.tenant.schema_name}/", body["photo"])
        self.assertEqual(body["created_by_email"], "worker@acme.com")

    def test_oversized_photo_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        big = SimpleUploadedFile(
            "big.png", b"x" * (5 * 1024 * 1024 + 1), content_type="image/png"
        )
        self.client.force_authenticate(self.member)
        response = self.client.post(
            "/api/v1/findings/",
            {"title": "Dev fotoğraf", "photo": big},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("photo", response.json())

    def test_member_cannot_close(self):
        finding = Finding.objects.create(title="Kaçak", created_by=self.member)
        self.client.force_authenticate(self.member)
        response = self.client.post(f"/api/v1/findings/{finding.id}/close/")
        self.assertEqual(response.status_code, 403)

    def test_manager_closes_finding(self):
        finding = Finding.objects.create(title="Kaçak", created_by=self.member)
        self.client.force_authenticate(self.manager)
        response = self.client.post(f"/api/v1/findings/{finding.id}/close/")
        self.assertEqual(response.json()["status"], "closed")

    def test_filter_open_findings(self):
        Finding.objects.create(title="Açık", created_by=self.member)
        Finding.objects.create(
            title="Kapalı", created_by=self.member, status=Finding.Status.CLOSED
        )
        self.client.force_authenticate(self.member)
        response = self.client.get("/api/v1/findings/?status=open")
        self.assertEqual(response.json()["count"], 1)
