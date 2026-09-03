from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.notifications.models import Notification


class NotificationApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.user = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.other = User.objects.create_user(email="other@acme.com", password="pw-123456")
        self.mine = Notification.objects.create(user=self.user, title="Benim bildirim")
        Notification.objects.create(user=self.other, title="Başkasının bildirimi")

    def test_only_own_notifications_listed(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/v1/notifications/")
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["title"], "Benim bildirim")

    def test_unread_count(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/v1/notifications/unread_count/")
        self.assertEqual(response.json()["count"], 1)

    def test_mark_read(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(f"/api/v1/notifications/{self.mine.id}/mark_read/")
        self.assertTrue(response.json()["read"])

    def test_cannot_read_others_notification(self):
        self.client.force_authenticate(self.user)
        other_notification = Notification.objects.get(user=self.other)
        response = self.client.post(
            f"/api/v1/notifications/{other_notification.id}/mark_read/"
        )
        self.assertEqual(response.status_code, 404)

    def test_mark_all_read(self):
        Notification.objects.create(user=self.user, title="İkinci")
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/v1/notifications/mark_all_read/")
        self.assertEqual(response.json()["updated"], 2)
        count = self.client.get("/api/v1/notifications/unread_count/").json()["count"]
        self.assertEqual(count, 0)
