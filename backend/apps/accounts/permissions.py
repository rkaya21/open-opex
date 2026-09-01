from rest_framework.permissions import BasePermission

from apps.accounts.models import User


class IsAdmin(BasePermission):
    """Allows access only to tenant admins."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user.is_authenticated and request.user.role == User.Role.ADMIN
        )


class IsManagerOrAdmin(BasePermission):
    """Allows access to managers (process owners) and admins."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user.is_authenticated
            and request.user.role in (User.Role.ADMIN, User.Role.MANAGER)
        )
