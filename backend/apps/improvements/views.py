from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsManagerOrAdmin
from apps.improvements.models import ImprovementProject, Suggestion
from apps.improvements.serializers import (
    EvaluateSerializer,
    ImprovementProjectSerializer,
    SuggestionSerializer,
)
from apps.improvements.services import sync_implemented_suggestions_kpi


class SuggestionViewSet(viewsets.ModelViewSet):
    """Employee suggestion box.

    Any member can submit and read; the submitter may edit or delete their own
    suggestion while it is still 'submitted'. Evaluation (approve / reject /
    implement) needs manager or admin.
    """

    serializer_class = SuggestionSerializer

    MANAGER_ACTIONS = ("approve", "reject", "implement")

    def get_permissions(self):
        if self.action in self.MANAGER_ACTIONS:
            return [IsManagerOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Suggestion.objects.select_related(
            "submitted_by", "evaluated_by", "process"
        )
        params = self.request.query_params
        if status_param := params.get("status"):
            queryset = queryset.filter(status=status_param)
        if category := params.get("category"):
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer) -> None:
        serializer.save(submitted_by=self.request.user)

    def _check_owner_edit(self, suggestion: Suggestion) -> None:
        user = self.request.user
        is_manager = user.role in (User.Role.ADMIN, User.Role.MANAGER)
        if not is_manager and suggestion.submitted_by_id != user.id:
            raise PermissionDenied("You can only modify your own suggestions.")
        if suggestion.status != Suggestion.Status.SUBMITTED:
            raise PermissionDenied("Evaluated suggestions can no longer be modified.")

    def perform_update(self, serializer) -> None:
        self._check_owner_edit(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance: Suggestion) -> None:
        self._check_owner_edit(instance)
        instance.delete()

    def _evaluate(self, request, *, approve: bool):
        serializer = EvaluateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        suggestion = self.get_object()
        try:
            suggestion.evaluate(
                approve=approve,
                note=serializer.validated_data["note"],
                by=request.user,
            )
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(SuggestionSerializer(suggestion).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._evaluate(request, approve=True)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._evaluate(request, approve=False)

    @action(detail=True, methods=["post"])
    def implement(self, request, pk=None):
        suggestion = self.get_object()
        try:
            suggestion.mark_implemented()
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST
            )
        sync_implemented_suggestions_kpi(timezone.now().date())
        return Response(SuggestionSerializer(suggestion).data)


class ImprovementProjectViewSet(viewsets.ModelViewSet):
    """PDCA / A3 improvement projects. Read: all members; write: manager/admin."""

    serializer_class = ImprovementProjectSerializer

    READ_ACTIONS = ("list", "retrieve")

    def get_permissions(self):
        if self.action in self.READ_ACTIONS:
            return [IsAuthenticated()]
        return [IsManagerOrAdmin()]

    def get_queryset(self):
        queryset = ImprovementProject.objects.select_related(
            "lead", "process", "kpi", "suggestion"
        ).prefetch_related("team")
        params = self.request.query_params
        if phase := params.get("phase"):
            queryset = queryset.filter(phase=phase)
        if process := params.get("process"):
            queryset = queryset.filter(process_id=process)
        return queryset

    @action(detail=True, methods=["post"])
    def advance(self, request, pk=None):
        """Move the project to the next PDCA phase."""
        project = self.get_object()
        try:
            project.advance_phase()
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(ImprovementProjectSerializer(project).data)
