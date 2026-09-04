import io

from django.core.files.uploadedfile import SimpleUploadedFile
from django_tenants.test.cases import TenantTestCase
from PIL import Image
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.beforeafter.models import BeforeAfterForm, BeforeAfterPhoto


def _png() -> SimpleUploadedFile:
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), "blue").save(buffer, format="PNG")
    return SimpleUploadedFile("photo.png", buffer.getvalue(), content_type="image/png")


class BeforeAfterApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.other = User.objects.create_user(email="other@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )

    def _create(self, user=None) -> int:
        self.client.force_authenticate(user or self.member)
        response = self.client.post(
            "/api/v1/beforeafter/",
            {
                "start_date": "2026-09-01",
                "end_date": "2026-09-04",
                "category": "energy",
                "problem": "Kompresör sürekli boşta çalışıyor.",
                "before_note": "Boşta 8 saat/gün",
                "after_note": "Otomatik durdurma eklendi",
                "cost": "500",
                "gain_continuity": "continuous",
                "one_time_gain": "12000",
                "gain_category": "energy",
            },
            format="json",
        )
        assert response.status_code == 201, response.json()
        return response.json()["id"]

    def test_member_creates_form(self):
        form_id = self._create()
        form = BeforeAfterForm.objects.get(id=form_id)
        self.assertEqual(form.created_by, self.member)
        self.assertEqual(form.category, "energy")

    def test_category_labels_returned(self):
        self.client.force_authenticate(self.member)
        body = self.client.get(f"/api/v1/beforeafter/{self._create()}/").json()
        self.assertEqual(body["category_label"], "Enerji Kazancı")
        self.assertEqual(body["gain_category_label"], "Enerji Kazancı")

    def test_add_before_and_after_photos_tenant_scoped(self):
        form_id = self._create()
        for kind in ("before", "after"):
            response = self.client.post(
                f"/api/v1/beforeafter/{form_id}/add_photo/",
                {"kind": kind, "image": _png()},
                format="multipart",
            )
            self.assertEqual(response.status_code, 201, response.json())
            self.assertIn(f"beforeafter/{self.tenant.schema_name}/", response.json()["image"])
        body = self.client.get(f"/api/v1/beforeafter/{form_id}/").json()
        self.assertEqual(len(body["photos"]), 2)

    def test_max_five_photos_per_kind(self):
        form_id = self._create()
        form = BeforeAfterForm.objects.get(id=form_id)
        for _ in range(5):
            BeforeAfterPhoto.objects.create(form=form, kind="before", image="x.png")
        response = self.client.post(
            f"/api/v1/beforeafter/{form_id}/add_photo/",
            {"kind": "before", "image": _png()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)

    def test_other_member_cannot_edit(self):
        form_id = self._create()
        self.client.force_authenticate(self.other)
        response = self.client.patch(
            f"/api/v1/beforeafter/{form_id}/", {"problem": "hack"}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_manager_can_edit(self):
        form_id = self._create()
        self.client.force_authenticate(self.manager)
        response = self.client.patch(
            f"/api/v1/beforeafter/{form_id}/", {"problem": "revize"}, format="json"
        )
        self.assertEqual(response.status_code, 200)

    def test_filter_by_category(self):
        self._create()
        self.client.force_authenticate(self.member)
        self.client.post(
            "/api/v1/beforeafter/",
            {"start_date": "2026-09-01", "category": "quality", "problem": "x"},
            format="json",
        )
        response = self.client.get("/api/v1/beforeafter/?category=quality")
        self.assertEqual(response.json()["count"], 1)

    def test_list_requires_auth(self):
        response = self.client.get("/api/v1/beforeafter/")
        self.assertEqual(response.status_code, 401)
