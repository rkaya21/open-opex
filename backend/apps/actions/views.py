import csv

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import filters, viewsets
from rest_framework import status as http_status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.actions.models import Action
from apps.actions.serializers import ActionSerializer
from apps.audits.models import Audit
from apps.audits.serializers import AuditSerializer
from apps.exports import csv_escape
from apps.improvements.models import ImprovementProject, Suggestion
from apps.improvements.serializers import (
    ImprovementProjectSerializer,
    SuggestionSerializer,
)


def _is_manager(user) -> bool:
    return user.role in (User.Role.ADMIN, User.Role.MANAGER)


class ActionViewSet(viewsets.ModelViewSet):
    """The shared CAPA action pool.

    Everyone reads; managers create/edit/delete. An assignee may update the
    status of their own action (shop-floor completion) but nothing else.
    """

    serializer_class = ActionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description"]

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Action.objects.select_related(
            "assignee", "finding", "suggestion", "project", "asakai_item"
        )
        params = self.request.query_params
        if status_param := params.get("status"):
            queryset = queryset.filter(status=status_param)
        if params.get("mine") == "true":
            queryset = queryset.filter(assignee=self.request.user)
        return queryset

    def perform_create(self, serializer) -> None:
        if not _is_manager(self.request.user):
            raise PermissionDenied("Only managers can create actions.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer) -> None:
        user = self.request.user
        instance: Action = serializer.instance
        if not _is_manager(user):
            if instance.assignee_id != user.id:
                raise PermissionDenied("You can only update your own actions.")
            allowed = {"status"}
            requested = set(self.request.data.keys())
            if not requested <= allowed:
                raise PermissionDenied("Assignees may only change the status.")
        new_status = serializer.validated_data.get("status", instance.status)
        completed_at = instance.completed_at
        if new_status == Action.Status.DONE and instance.status != Action.Status.DONE:
            completed_at = timezone.now()
        elif new_status != Action.Status.DONE:
            completed_at = None
        serializer.save(completed_at=completed_at)

    def perform_destroy(self, instance) -> None:
        if not _is_manager(self.request.user):
            raise PermissionDenied("Only managers can delete actions.")
        instance.delete()

    @action(detail=False)
    def export(self, request):
        """The (filtered) action pool as CSV."""
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="actions.csv"'
        writer = csv.writer(response)
        writer.writerow(
            ["title", "assignee", "due_date", "status", "source", "completed_at"]
        )
        for item in self.get_queryset():
            source = (
                (item.finding and f"finding: {item.finding.title}")
                or (item.suggestion and f"suggestion: {item.suggestion.title}")
                or (item.project and f"project: {item.project.title}")
                or (item.asakai_item and f"asakai: {item.asakai_item.description}")
                or ""
            )
            writer.writerow(
                [
                    csv_escape(item.title),
                    csv_escape(item.assignee.email if item.assignee else ""),
                    item.due_date or "",
                    item.status,
                    csv_escape(source),
                    item.completed_at or "",
                ]
            )
        return response


class MyWorkView(APIView):
    """Everything pending on the signed-in user, with counts per bucket."""

    def get(self, request):
        user = request.user
        my_actions = (
            Action.objects.select_related("assignee", "finding", "suggestion", "project")
            .filter(assignee=user)
            .exclude(status=Action.Status.DONE)
        )
        my_audits = Audit.objects.select_related("template", "area", "auditor").filter(
            auditor=user, status=Audit.Status.PLANNED
        )
        my_suggestions = Suggestion.objects.select_related(
            "submitted_by", "evaluated_by", "process"
        ).filter(
            submitted_by=user,
            status__in=[Suggestion.Status.SUBMITTED, Suggestion.Status.APPROVED],
        )
        my_projects = (
            ImprovementProject.objects.select_related(
                "lead", "process", "kpi", "suggestion"
            )
            .prefetch_related("team")
            .filter(lead=user)
            .exclude(phase=ImprovementProject.Phase.DONE)
        )

        payload = {
            "actions": ActionSerializer(my_actions, many=True).data,
            "audits": AuditSerializer(my_audits, many=True).data,
            "suggestions": SuggestionSerializer(my_suggestions, many=True).data,
            "projects": ImprovementProjectSerializer(my_projects, many=True).data,
        }
        if _is_manager(user):
            to_evaluate = Suggestion.objects.select_related(
                "submitted_by", "evaluated_by", "process"
            ).filter(status=Suggestion.Status.SUBMITTED)
            payload["suggestions_to_evaluate"] = SuggestionSerializer(
                to_evaluate, many=True
            ).data
        return Response(payload, status=http_status.HTTP_200_OK)
