from django.core.exceptions import ValidationError
from django.db.models import Count
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsManagerOrAdmin
from apps.processes.models import Process
from apps.processes.serializers import ProcessSerializer, build_process_tree


class ProcessViewSet(viewsets.ModelViewSet):
    """Process map CRUD.

    Reading is open to all tenant members; writing requires manager or admin.
    """

    serializer_class = ProcessSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "code"]
    ordering_fields = ["code", "name", "updated_at"]

    READ_ACTIONS = ("list", "retrieve", "tree")

    def get_permissions(self):
        # Explicit allowlist: only read actions are open to every member;
        # anything else (create/update/destroy/publish/archive/…) needs
        # manager or admin.
        if self.action in self.READ_ACTIONS:
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]

    def get_queryset(self):
        queryset = Process.objects.select_related("owner").annotate(
            children_count=Count("children")
        )
        params = self.request.query_params
        if status_param := params.get("status"):
            queryset = queryset.filter(status=status_param)
        if owner := params.get("owner"):
            queryset = queryset.filter(owner_id=owner)
        if parent := params.get("parent"):
            queryset = queryset.filter(
                parent__isnull=True if parent == "null" else False,
                **({} if parent == "null" else {"parent_id": parent}),
            )
        return queryset

    def perform_destroy(self, instance) -> None:
        if instance.status != Process.Status.DRAFT:
            raise DRFValidationError(
                {"detail": "Only draft processes can be deleted; archive published ones."}
            )
        instance.delete()

    @action(detail=False)
    def tree(self, request):
        """Full process hierarchy of any depth, built from a single query."""
        return Response(build_process_tree(Process.objects.order_by("code")))

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        process = self.get_object()
        try:
            process.publish()
        except ValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ProcessSerializer(self._annotated(process)).data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        process = self.get_object()
        process.archive()
        return Response(ProcessSerializer(self._annotated(process)).data)

    def _annotated(self, process: Process) -> Process:
        return self.get_queryset().get(pk=process.pk)
