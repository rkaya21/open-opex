from django_tenants.test.cases import TenantTestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.actions.models import Action
from apps.audits.models import Area
from apps.meetings.models import AsakaiItem, AsakaiMeeting


class AsakaiMeetingApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.other = User.objects.create_user(email="other@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )
        self.area = Area.objects.create(name="Haddehane", code="SAHA-03")

    def _create_meeting(self, user=None) -> int:
        self.client.force_authenticate(user or self.member)
        response = self.client.post(
            "/api/v1/asakai/",
            {
                "title": "HH3 Asakai toplantısı",
                "area": self.area.id,
                "held_at": "2026-09-04T07:30:00Z",
                "participant_count": 24,
            },
        )
        assert response.status_code == 201, response.json()
        return response.json()["id"]

    def test_member_creates_meeting(self):
        meeting_id = self._create_meeting()
        meeting = AsakaiMeeting.objects.get(id=meeting_id)
        self.assertEqual(meeting.created_by, self.member)
        self.assertEqual(meeting.participant_count, 24)

    def test_other_member_cannot_edit(self):
        meeting_id = self._create_meeting()
        self.client.force_authenticate(self.other)
        response = self.client.patch(f"/api/v1/asakai/{meeting_id}/", {"title": "X"})
        self.assertEqual(response.status_code, 403)

    def test_creator_and_manager_can_edit(self):
        meeting_id = self._create_meeting()
        response = self.client.patch(
            f"/api/v1/asakai/{meeting_id}/", {"participant_count": 25}
        )
        self.assertEqual(response.status_code, 200)
        self.client.force_authenticate(self.manager)
        response = self.client.patch(f"/api/v1/asakai/{meeting_id}/", {"title": "Rev"})
        self.assertEqual(response.status_code, 200)

    def test_filters(self):
        self._create_meeting()
        other_area = Area.objects.create(name="Çelikhane", code="SAHA-04")
        AsakaiMeeting.objects.create(
            title="Çelikhane Asakai",
            area=other_area,
            held_at="2026-08-01T07:00:00Z",
            created_by=self.other,
        )
        self.client.force_authenticate(self.member)
        by_area = self.client.get(f"/api/v1/asakai/?area={self.area.id}").json()
        self.assertEqual(by_area["count"], 1)
        by_date = self.client.get("/api/v1/asakai/?from=2026-09-01").json()
        self.assertEqual(by_date["count"], 1)
        by_creator = self.client.get(f"/api/v1/asakai/?created_by={self.other.id}").json()
        self.assertEqual(by_creator["count"], 1)


class AsakaiItemApiTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        domain = self.tenant.domains.first().domain
        self.client = APIClient(HTTP_HOST=domain)
        self.member = User.objects.create_user(email="worker@acme.com", password="pw-123456")
        self.manager = User.objects.create_user(
            email="lead@acme.com", password="pw-123456", role=User.Role.MANAGER
        )
        self.meeting = AsakaiMeeting.objects.create(
            title="Asakai", held_at="2026-09-04T07:30:00Z", created_by=self.member
        )

    def test_member_adds_item(self):
        self.client.force_authenticate(self.member)
        response = self.client.post(
            "/api/v1/asakai-items/",
            {"meeting": self.meeting.id, "description": "Vinç halatı yıpranmış"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "open")

    def test_meeting_counts_open_items(self):
        AsakaiItem.objects.create(meeting=self.meeting, description="A")
        AsakaiItem.objects.create(
            meeting=self.meeting, description="B", status=AsakaiItem.Status.DONE
        )
        self.client.force_authenticate(self.member)
        body = self.client.get(f"/api/v1/asakai/{self.meeting.id}/").json()
        self.assertEqual(body["items_count"], 2)
        self.assertEqual(body["open_items_count"], 1)

    def test_member_cannot_escalate_to_action(self):
        item = AsakaiItem.objects.create(meeting=self.meeting, description="Konu")
        self.client.force_authenticate(self.member)
        response = self.client.post(f"/api/v1/asakai-items/{item.id}/to_action/")
        self.assertEqual(response.status_code, 403)

    def test_manager_escalates_item_to_action(self):
        item = AsakaiItem.objects.create(
            meeting=self.meeting, description="Vinç halatı yıpranmış"
        )
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            f"/api/v1/asakai-items/{item.id}/to_action/",
            {"assignee": self.member.id, "due_date": "2026-09-10"},
        )
        self.assertEqual(response.status_code, 201)
        action = Action.objects.get(asakai_item=item)
        self.assertEqual(action.title, "Vinç halatı yıpranmış")
        self.assertEqual(action.assignee, self.member)
        item_body = self.client.get(f"/api/v1/asakai-items/{item.id}/").json()
        self.assertEqual(item_body["action_ids"], [action.id])

    def test_to_action_rejects_invalid_assignee(self):
        item = AsakaiItem.objects.create(meeting=self.meeting, description="Konu")
        self.client.force_authenticate(self.manager)
        response = self.client.post(
            f"/api/v1/asakai-items/{item.id}/to_action/", {"assignee": 999999}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("assignee", response.json())
        self.assertEqual(Action.objects.count(), 0)

    def test_filter_items_by_status_and_meeting(self):
        AsakaiItem.objects.create(meeting=self.meeting, description="Açık")
        AsakaiItem.objects.create(
            meeting=self.meeting, description="Bitti", status=AsakaiItem.Status.DONE
        )
        self.client.force_authenticate(self.member)
        open_items = self.client.get("/api/v1/asakai-items/?status=open").json()
        self.assertEqual(open_items["count"], 1)
        by_meeting = self.client.get(
            f"/api/v1/asakai-items/?meeting={self.meeting.id}"
        ).json()
        self.assertEqual(by_meeting["count"], 2)
