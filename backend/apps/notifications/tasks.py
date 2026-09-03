"""Celery tasks — iterate every tenant schema and run the alert rules."""

from celery import shared_task
from django_tenants.utils import get_public_schema_name, get_tenant_model, schema_context

from apps.notifications import alerts


@shared_task
def run_smart_alerts() -> dict[str, int]:
    """Daily rule-based alert sweep across all tenants."""
    results: dict[str, int] = {}
    tenant_model = get_tenant_model()
    schemas = tenant_model.objects.exclude(
        schema_name=get_public_schema_name()
    ).values_list("schema_name", flat=True)
    for schema in schemas:
        with schema_context(schema):
            results[schema] = alerts.check_kpi_alerts() + alerts.check_action_reminders()
    return results
