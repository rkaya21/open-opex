from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.beforeafter.models import BeforeAfterForm, BeforeAfterPhoto
from apps.beforeafter.serializers import (
    BeforeAfterFormSerializer,
    BeforeAfterPhotoSerializer,
)


def _is_manager(user) -> bool:
    return user.role in (User.Role.ADMIN, User.Role.MANAGER)


class BeforeAfterFormViewSet(viewsets.ModelViewSet):
    """Before/after improvement forms.

    Any member records one; only the creator or a manager may edit/delete.
    """

    serializer_class = BeforeAfterFormSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = BeforeAfterForm.objects.select_related(
            "created_by", "process"
        ).prefetch_related("photos")
        if category := self.request.query_params.get("category"):
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer) -> None:
        serializer.save(created_by=self.request.user)

    def _check_edit(self, form: BeforeAfterForm) -> None:
        user = self.request.user
        if not _is_manager(user) and form.created_by_id != user.id:
            raise PermissionDenied("Only the creator or a manager can modify this record.")

    def perform_update(self, serializer) -> None:
        self._check_edit(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance) -> None:
        self._check_edit(instance)
        instance.delete()

    @action(detail=True, methods=["post"])
    def add_photo(self, request, pk=None):
        """Attach a before/after photo (multipart). Max 5 per kind."""
        form = self.get_object()
        self._check_edit(form)
        serializer = BeforeAfterPhotoSerializer(
            data={"kind": request.data.get("kind"),
                  "caption": request.data.get("caption", ""),
                  "image": request.data.get("image"),
                  "form": form.id}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BeforeAfterPhotoViewSet(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """Delete a photo (creator-or-manager)."""

    queryset = BeforeAfterPhoto.objects.select_related("form", "form__created_by")
    serializer_class = BeforeAfterPhotoSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance) -> None:
        user = self.request.user
        if not _is_manager(user) and instance.form.created_by_id != user.id:
            raise PermissionDenied("Only the creator or a manager can delete this photo.")
        instance.delete()
