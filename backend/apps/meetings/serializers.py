from rest_framework import serializers

from apps.accounts.models import User
from apps.meetings.models import AsakaiItem, AsakaiMeeting


class AsakaiItemSerializer(serializers.ModelSerializer):
    meeting_title = serializers.CharField(source="meeting.title", read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)
    action_ids = serializers.PrimaryKeyRelatedField(
        source="actions", many=True, read_only=True
    )

    class Meta:
        model = AsakaiItem
        fields = [
            "id",
            "meeting",
            "meeting_title",
            "description",
            "status",
            "created_by",
            "created_by_email",
            "action_ids",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]


class AsakaiMeetingSerializer(serializers.ModelSerializer):
    area_code = serializers.CharField(source="area.code", read_only=True)
    area_name = serializers.CharField(source="area.name", read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)
    items_count = serializers.IntegerField(source="items.count", read_only=True)
    open_items_count = serializers.SerializerMethodField()

    class Meta:
        model = AsakaiMeeting
        fields = [
            "id",
            "title",
            "area",
            "area_code",
            "area_name",
            "held_at",
            "participant_count",
            "notes",
            "created_by",
            "created_by_email",
            "items_count",
            "open_items_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]

    def get_open_items_count(self, obj: AsakaiMeeting) -> int:
        return sum(1 for item in obj.items.all() if item.status == AsakaiItem.Status.OPEN)


class ItemToActionSerializer(serializers.Serializer):
    assignee = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        default=None,
    )
    due_date = serializers.DateField(required=False, allow_null=True, default=None)
