from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsManagerOrAdmin
from apps.kpis.models import KPI, KPIMeasurement
from apps.kpis.serializers import (
    KPIMeasurementSerializer,
    KPISerializer,
    MeasurementUpsertSerializer,
)
from apps.kpis.templates import KPI_TEMPLATES


class KPIViewSet(viewsets.ModelViewSet):
    """KPI definitions and measurements.

    Reading and measurement entry are open to every tenant member (shop-floor
    data entry); KPI definition changes need manager or admin.
    """

    serializer_class = KPISerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "updated_at"]

    READ_ACTIONS = ("list", "retrieve", "dashboard", "templates", "measurements")

    def get_permissions(self):
        if self.action in self.READ_ACTIONS:
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]

    def get_queryset(self):
        queryset = (
            KPI.objects.select_related("process")
            .prefetch_related("measurements")
            .order_by("name")
        )
        params = self.request.query_params
        if process := params.get("process"):
            queryset = queryset.filter(process_id=process)
        if params.get("active") == "true":
            queryset = queryset.filter(is_active=True)
        return queryset

    @action(detail=False)
    def templates(self, request):
        """Built-in KPI templates used to pre-fill the create form."""
        return Response(KPI_TEMPLATES)

    @action(detail=False)
    def dashboard(self, request):
        """Active KPIs with latest value, status and trend — one payload."""
        queryset = self.get_queryset().filter(is_active=True)
        return Response(KPISerializer(queryset, many=True).data)

    @action(detail=True, methods=["get", "put"])
    def measurements(self, request, pk=None):
        """GET: full history. PUT: idempotent bulk upsert keyed by period.

        PUT body: [{"period": "2026-01-01", "value": "85.5", "note": ""}, …]
        Re-sending a period overwrites its value, so automated collectors can
        safely retry.
        """
        kpi = self.get_object()
        if request.method == "GET":
            return Response(
                KPIMeasurementSerializer(kpi.measurements.all(), many=True).data
            )

        serializer = MeasurementUpsertSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        for item in serializer.validated_data:
            # created_by is only set on create so the original recorder stays
            # in the audit trail when a period is overwritten.
            KPIMeasurement.objects.update_or_create(
                kpi=kpi,
                period=item["period"],
                defaults={
                    "value": item["value"],
                    "note": item.get("note", ""),
                },
                create_defaults={
                    "value": item["value"],
                    "note": item.get("note", ""),
                    "created_by": request.user,
                },
            )
        return Response(
            KPIMeasurementSerializer(kpi.measurements.all(), many=True).data
        )
