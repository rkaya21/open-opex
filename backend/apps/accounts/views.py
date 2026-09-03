from rest_framework.generics import ListAPIView, RetrieveAPIView

from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer


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
