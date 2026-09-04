from rest_framework import mixins, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView, RetrieveAPIView

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin
from apps.accounts.serializers import AdminUserSerializer, UserSerializer


class MeView(RetrieveAPIView):
    """Return the authenticated user's profile within the current tenant."""

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserListView(ListAPIView):
    """Active users of the tenant — used for assignee/auditor pickers."""

    serializer_class = UserSerializer
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(is_active=True).order_by("email")


class UserAdminViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Tenant user management (admin only). No delete — deactivate instead."""

    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.order_by("email")

    def perform_update(self, serializer) -> None:
        instance: User = serializer.instance
        if instance.id == self.request.user.id:
            changing_role = (
                "role" in serializer.validated_data
                and serializer.validated_data["role"] != instance.role
            )
            deactivating = serializer.validated_data.get("is_active", True) is False
            if changing_role or deactivating:
                # Prevents the last admin from locking themselves out
                raise PermissionDenied(
                    "You cannot change your own role or deactivate yourself."
                )
        serializer.save()
