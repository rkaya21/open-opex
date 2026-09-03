from rest_framework import serializers

from apps.audits.models import (
    Area,
    Audit,
    AuditAnswer,
    ChecklistItem,
    ChecklistTemplate,
    Finding,
)


class AreaSerializer(serializers.ModelSerializer):
    responsible_email = serializers.CharField(source="responsible.email", read_only=True)
    last_score = serializers.SerializerMethodField()

    class Meta:
        model = Area
        fields = [
            "id",
            "name",
            "code",
            "description",
            "responsible",
            "responsible_email",
            "is_active",
            "last_score",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_last_score(self, obj: Area) -> str | None:
        last = (
            obj.audits.filter(status=Audit.Status.COMPLETED)
            .order_by("-completed_at")
            .first()
        )
        return str(last.score_percent) if last else None


class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ["id", "text", "category", "order"]
        read_only_fields = ["id"]


class ChecklistTemplateSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, required=False)

    class Meta:
        model = ChecklistTemplate
        fields = ["id", "name", "description", "is_active", "items", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        items = validated_data.pop("items", [])
        template = ChecklistTemplate.objects.create(**validated_data)
        self._sync_items(template, items)
        return template

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        instance = super().update(instance, validated_data)
        if items is not None:
            instance.items.all().delete()
            self._sync_items(instance, items)
        return instance

    @staticmethod
    def _sync_items(template: ChecklistTemplate, items: list[dict]) -> None:
        ChecklistItem.objects.bulk_create(
            ChecklistItem(template=template, order=index, **item)
            for index, item in enumerate(items)
        )


class AuditAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditAnswer
        fields = ["id", "item", "score", "note"]
        read_only_fields = ["id"]


class AnswerUpsertSerializer(serializers.Serializer):
    item = serializers.IntegerField()
    score = serializers.IntegerField(min_value=0, max_value=ChecklistItem.MAX_SCORE)
    note = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default=""
    )


class AuditSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template.name", read_only=True)
    area_code = serializers.CharField(source="area.code", read_only=True)
    area_name = serializers.CharField(source="area.name", read_only=True)
    auditor_email = serializers.CharField(source="auditor.email", read_only=True)
    answers = AuditAnswerSerializer(many=True, read_only=True)
    findings_count = serializers.IntegerField(source="findings.count", read_only=True)

    class Meta:
        model = Audit
        fields = [
            "id",
            "template",
            "template_name",
            "area",
            "area_code",
            "area_name",
            "auditor",
            "auditor_email",
            "scheduled_date",
            "status",
            "completed_at",
            "score_percent",
            "answers",
            "findings_count",
            "created_at",
        ]
        read_only_fields = ["id", "status", "completed_at", "score_percent", "created_at"]


MAX_PHOTO_BYTES = 5 * 1024 * 1024


class FindingSerializer(serializers.ModelSerializer):
    area_code = serializers.CharField(source="area.code", read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)

    def validate_photo(self, value):
        if value and value.size > MAX_PHOTO_BYTES:
            raise serializers.ValidationError("Photo must be smaller than 5 MB.")
        return value

    class Meta:
        model = Finding
        fields = [
            "id",
            "title",
            "description",
            "audit",
            "area",
            "area_code",
            "photo",
            "status",
            "created_by",
            "created_by_email",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]
