from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsManagerOrAdmin
from apps.audits.models import Area, Audit, AuditAnswer, ChecklistTemplate, Finding
from apps.audits.serializers import (
    AnswerUpsertSerializer,
    AreaSerializer,
    AuditSerializer,
    ChecklistTemplateSerializer,
    FindingSerializer,
)


class ManagerWritesViewSet(viewsets.ModelViewSet):
    """Read for every member; create/update/delete for manager/admin."""

    READ_ACTIONS = ("list", "retrieve")

    def get_permissions(self):
        if self.action in self.READ_ACTIONS:
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]


class AreaViewSet(ManagerWritesViewSet):
    serializer_class = AreaSerializer

    def get_queryset(self):
        queryset = Area.objects.select_related("responsible", "checklist_template")
        if self.request.query_params.get("active") == "true":
            queryset = queryset.filter(is_active=True)
        return queryset


class ChecklistTemplateViewSet(ManagerWritesViewSet):
    serializer_class = ChecklistTemplateSerializer

    def get_queryset(self):
        return ChecklistTemplate.objects.prefetch_related("items")


class AuditViewSet(ManagerWritesViewSet):
    """Audit scheduling and execution.

    Scoring (answers) and completion are open to every authenticated member so
    the assigned auditor — usually not a manager — can run the audit from a
    tablet on the shop floor.
    """

    serializer_class = AuditSerializer
    READ_ACTIONS = ("list", "retrieve", "answers", "complete")

    def get_queryset(self):
        queryset = Audit.objects.select_related(
            "template", "area", "auditor"
        ).prefetch_related("answers")
        params = self.request.query_params
        if status_param := params.get("status"):
            queryset = queryset.filter(status=status_param)
        if area := params.get("area"):
            queryset = queryset.filter(area_id=area)
        return queryset

    @action(detail=True, methods=["put"])
    def answers(self, request, pk=None):
        """Idempotent bulk upsert of scores, keyed by checklist item."""
        audit = self.get_object()
        if audit.status == Audit.Status.COMPLETED:
            return Response(
                {"detail": "Completed audits can no longer be edited."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = AnswerUpsertSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        valid_items = set(audit.template.items.values_list("id", flat=True))
        for entry in serializer.validated_data:
            if entry["item"] not in valid_items:
                return Response(
                    {"detail": f"Item {entry['item']} is not part of this checklist."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            AuditAnswer.objects.update_or_create(
                audit=audit,
                item_id=entry["item"],
                defaults={"score": entry["score"], "note": entry.get("note", "")},
            )
        return Response(AuditSerializer(audit).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        self.get_object()  # permission + 404 check
        try:
            with transaction.atomic():
                # Row lock so two concurrent completes can't both pass the
                # status check and double-write the score.
                audit = Audit.objects.select_for_update().get(pk=pk)
                audit.complete()
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(AuditSerializer(audit).data)


class FindingViewSet(viewsets.ModelViewSet):
    """Findings are open to every member (anyone can flag a nonconformity);
    closing one requires manager/admin."""

    serializer_class = FindingSerializer

    def get_permissions(self):
        if self.action == "close":
            return [IsManagerOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Finding.objects.select_related("area", "created_by")
        params = self.request.query_params
        if status_param := params.get("status"):
            queryset = queryset.filter(status=status_param)
        if audit := params.get("audit"):
            queryset = queryset.filter(audit_id=audit)
        return queryset

    def perform_create(self, serializer) -> None:
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        finding = self.get_object()
        finding.status = Finding.Status.CLOSED
        finding.save(update_fields=["status", "updated_at"])
        return Response(FindingSerializer(finding).data)
