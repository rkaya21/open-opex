from django.core.management import CommandError, call_command
from django.db import connection
from django.test import TransactionTestCase
from django_tenants.utils import get_public_schema_name, schema_context

from apps.tenants.models import Company, Domain


class BootstrapTenantCommandTests(TransactionTestCase):
    def tearDown(self):
        # TransactionTestCase truncates public tables between tests, but the
        # tenant schema created by the command is DDL and survives — drop it.
        with connection.cursor() as cursor:
            cursor.execute('DROP SCHEMA IF EXISTS "acme" CASCADE')
        super().tearDown()

    def _run(self, schema: str = "acme"):
        call_command(
            "bootstrap_tenant",
            schema=schema,
            name="Acme Manufacturing",
            domain=f"{schema}.localhost",
            admin_email="admin@acme.com",
            admin_password="s3cret-pw",
        )

    def test_creates_tenant_domain_and_admin(self):
        self._run()

        company = Company.objects.get(schema_name="acme")
        self.assertEqual(company.name, "Acme Manufacturing")

        domain = Domain.objects.get(tenant=company)
        self.assertEqual(domain.domain, "acme.localhost")
        self.assertTrue(domain.is_primary)

        with schema_context("acme"):
            from apps.accounts.models import User

            admin = User.objects.get(email="admin@acme.com")
            self.assertEqual(admin.role, User.Role.ADMIN)
            self.assertTrue(admin.is_superuser)

    def test_rejects_duplicate_schema(self):
        self._run()
        with self.assertRaises(CommandError):
            self._run()

    def test_public_schema_untouched(self):
        self._run()
        with schema_context(get_public_schema_name()):
            self.assertEqual(Company.objects.exclude(schema_name="public").count(), 1)
