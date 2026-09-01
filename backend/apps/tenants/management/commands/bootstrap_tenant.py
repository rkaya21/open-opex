"""Create a tenant (Company + Domain) and its first admin user.

Usage:
    python manage.py bootstrap_tenant --schema=acme --name="Acme Manufacturing" \
        --domain=acme.localhost --admin-email=admin@acme.com --admin-password=secret
"""

from django.core.management.base import BaseCommand, CommandError
from django_tenants.utils import schema_context

from apps.tenants.models import Company, Domain


class Command(BaseCommand):
    help = "Create a tenant with its domain and first admin user"

    def add_arguments(self, parser) -> None:
        parser.add_argument("--schema", required=True, help="PostgreSQL schema name (e.g. acme)")
        parser.add_argument("--name", required=True, help="Company display name")
        parser.add_argument("--domain", required=True, help="Hostname for this tenant")
        parser.add_argument("--admin-email", required=True)
        parser.add_argument("--admin-password", required=True)

    def handle(self, **options) -> None:
        schema = options["schema"]
        if Company.objects.filter(schema_name=schema).exists():
            raise CommandError(f"Tenant with schema '{schema}' already exists")

        company = Company.objects.create(schema_name=schema, name=options["name"])
        Domain.objects.create(domain=options["domain"], tenant=company, is_primary=True)

        with schema_context(schema):
            from apps.accounts.models import User

            User.objects.create_superuser(
                email=options["admin_email"],
                password=options["admin_password"],
                role=User.Role.ADMIN,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Tenant '{company.name}' created (schema={schema}, domain={options['domain']})"
            )
        )
