from rest_framework import filters, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import User
from apps.lessons.models import OnePointLesson
from apps.lessons.serializers import OnePointLessonSerializer


def _is_manager(user) -> bool:
    return user.role in (User.Role.ADMIN, User.Role.MANAGER)


class OnePointLessonViewSet(viewsets.ModelViewSet):
    """One-Point Lessons.

    Any member records a lesson (shop-floor trainers are usually members);
    only the creator or a manager may edit or delete it afterwards.
    """

    serializer_class = OnePointLessonSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["topic", "content"]
    ordering_fields = ["held_at", "created_at"]

    def get_queryset(self):
        queryset = OnePointLesson.objects.select_related(
            "trainer", "created_by", "process"
        ).prefetch_related("participants")
        params = self.request.query_params
        if category := params.get("category"):
            queryset = queryset.filter(category=category)
        if trainer := params.get("trainer"):
            queryset = queryset.filter(trainer_id=trainer)
        return queryset

    def perform_create(self, serializer) -> None:
        # Trainer defaults to whoever records the lesson
        trainer = serializer.validated_data.get("trainer") or self.request.user
        serializer.save(created_by=self.request.user, trainer=trainer)

    def _check_edit(self, lesson: OnePointLesson) -> None:
        user = self.request.user
        if not _is_manager(user) and lesson.created_by_id != user.id:
            raise PermissionDenied("Only the creator or a manager can modify this record.")

    def perform_update(self, serializer) -> None:
        self._check_edit(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance) -> None:
        self._check_edit(instance)
        instance.delete()
