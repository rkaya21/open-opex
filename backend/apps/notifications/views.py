from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """The signed-in user's notifications."""

    serializer_class = NotificationSerializer

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        if self.request.query_params.get("unread") == "true":
            queryset = queryset.filter(read=False)
        return queryset

    @action(detail=False)
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, read=False).count()
        return Response({"count": count})

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read = True
        notification.save(update_fields=["read"])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        updated = Notification.objects.filter(user=request.user, read=False).update(
            read=True
        )
        return Response({"updated": updated})
