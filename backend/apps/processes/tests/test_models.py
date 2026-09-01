from django.core.exceptions import ValidationError
from django_tenants.test.cases import TenantTestCase

from apps.processes.models import Process


class ProcessModelTests(TenantTestCase):
    def setUp(self):
        super().setUp()
        self.root = Process.objects.create(name="Production", code="PR-001")

    def test_str_shows_code_and_name(self):
        self.assertEqual(str(self.root), "PR-001 — Production")

    def test_cannot_be_own_parent(self):
        self.root.parent = self.root
        with self.assertRaises(ValidationError):
            self.root.clean()

    def test_cannot_move_under_descendant(self):
        child = Process.objects.create(name="Assembly", code="PR-002", parent=self.root)
        grandchild = Process.objects.create(name="Welding", code="PR-003", parent=child)
        self.root.parent = grandchild
        with self.assertRaises(ValidationError):
            self.root.clean()

    def test_publish_draft_keeps_version_1(self):
        self.root.publish()
        self.assertEqual(self.root.status, Process.Status.PUBLISHED)
        self.assertEqual(self.root.version, 1)

    def test_republish_bumps_version(self):
        self.root.publish()
        self.root.publish()
        self.assertEqual(self.root.version, 2)

    def test_archived_cannot_be_published(self):
        self.root.archive()
        with self.assertRaises(ValidationError):
            self.root.publish()

    def test_archive_sets_status(self):
        self.root.archive()
        self.assertEqual(self.root.status, Process.Status.ARCHIVED)
