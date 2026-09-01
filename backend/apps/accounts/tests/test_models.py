from django_tenants.test.cases import TenantTestCase

from apps.accounts.models import User


class UserManagerTests(TenantTestCase):
    def test_create_user_defaults_to_member_role(self):
        user = User.objects.create_user(email="worker@acme.com", password="s3cret-pw")
        self.assertEqual(user.role, User.Role.MEMBER)
        self.assertFalse(user.is_staff)
        self.assertTrue(user.check_password("s3cret-pw"))

    def test_create_superuser_is_admin(self):
        user = User.objects.create_superuser(email="boss@acme.com", password="s3cret-pw")
        self.assertEqual(user.role, User.Role.ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_email_is_required(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="s3cret-pw")

    def test_email_is_normalized(self):
        user = User.objects.create_user(email="Worker@ACME.COM", password="s3cret-pw")
        self.assertEqual(user.email, "Worker@acme.com")
