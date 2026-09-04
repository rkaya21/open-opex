from rest_framework import serializers

from apps.actions.models import Action


class ActionSerializer(serializers.ModelSerializer):
    assignee_email = serializers.CharField(source="assignee.email", read_only=True)
    finding_title = serializers.CharField(source="finding.title", read_only=True)
    suggestion_title = serializers.CharField(source="suggestion.title", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    asakai_item_description = serializers.CharField(
        source="asakai_item.description", read_only=True
    )

    class Meta:
        model = Action
        fields = [
            "id",
            "title",
            "description",
            "assignee",
            "assignee_email",
            "due_date",
            "status",
            "finding",
            "finding_title",
            "suggestion",
            "suggestion_title",
            "project",
            "project_title",
            "asakai_item",
            "asakai_item_description",
            "created_by",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "completed_at", "created_at", "updated_at"]
