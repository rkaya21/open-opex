from django.db import models
from django_tenants.models import DomainMixin, TenantMixin


class Company(TenantMixin):
    """A tenant: one organization using the platform, isolated in its own schema."""

    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    auto_create_schema = True

    def __str__(self) -> str:
        return self.name


class Domain(DomainMixin):
    """Hostname that resolves to a Company (e.g. acme.opex.example.com)."""

    def __str__(self) -> str:
        return self.domain
