from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.models import User
from apps.actions.models import Action
from apps.actions.serializers import ActionSerializer
from apps.meetings.models import AsakaiItem, AsakaiMeeting
from apps.meetings.serializers import (
    AsakaiItemSerializer,
    AsakaiMeetingSerializer,
    ItemToActionSerializer,
)


def _is_manager(user) -> bool:
    return user.role in (User.Role.ADMIN, User.Role.MANAGER)


class AsakaiMeetingViewSet(viewsets.ModelViewSet):
    """Asakai meeting records.

    Any member records a meeting (shop-floor supervisors are usually members);
    only the creator or a manager may edit or delete it afterwards.
    """

    serializer_class = AsakaiMeetingSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "notes"]
    ordering_fields = ["held_at", "created_at"]

    def get_queryset(self):
        queryset = AsakaiMeeting.objects.select_related(
            "area", "created_by"
        ).prefetch_related("items")
        params = self.request.query_params
        if area := params.get("area"):
            queryset = queryset.filter(area_id=area)
        if created_by := params.get("created_by"):
            queryset = queryset.filter(created_by_id=created_by)
        if date_from := params.get("from"):
            queryset = queryset.filter(held_at__date__gte=date_from)
        if date_to := params.get("to"):
            queryset = queryset.filter(held_at__date__lte=date_to)
        return queryset

    def perform_create(self, serializer) -> None:
        serializer.save(created_by=self.request.user)

    def _check_edit(self, meeting: AsakaiMeeting) -> None:
        user = self.request.user
        if not _is_manager(user) and meeting.created_by_id != user.id:
            raise PermissionDenied("Only the creator or a manager can modify this record.")

    def perform_update(self, serializer) -> None:
        self._check_edit(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance) -> None:
        self._check_edit(instance)
        instance.delete()


class AsakaiItemViewSet(viewsets.ModelViewSet):
    """Meeting topics; global list powers the "Asakai maddeleri" page."""

    serializer_class = AsakaiItemSerializer

    def get_queryset(self):
        queryset = AsakaiItem.objects.select_related(
            "meeting", "created_by"
        ).prefetch_related("actions")
        params = self.request.query_params
        if meeting := params.get("meeting"):
            queryset = queryset.filter(meeting_id=meeting)
        if status_param := params.get("status"):
            queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer) -> None:
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def to_action(self, request, pk=None):
        """Escalate the item into the shared action pool (manager only)."""
        if not _is_manager(request.user):
            raise PermissionDenied("Only managers can create actions.")
        item = self.get_object()
        serializer = ItemToActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = Action.objects.create(
            title=item.description[:200],
            asakai_item=item,
            assignee=serializer.validated_data.get("assignee"),
            due_date=serializer.validated_data.get("due_date"),
            created_by=request.user,
        )
        return Response(ActionSerializer(created).data, status=status.HTTP_201_CREATED)
