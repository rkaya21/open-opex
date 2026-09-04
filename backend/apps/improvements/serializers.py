from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.improvements.models import ImprovementProject, Suggestion


class SuggestionSerializer(serializers.ModelSerializer):
    submitted_by_detail = UserSerializer(source="submitted_by", read_only=True)
    evaluated_by_detail = UserSerializer(source="evaluated_by", read_only=True)
    process_code = serializers.CharField(source="process.code", read_only=True)

    class Meta:
        model = Suggestion
        fields = [
            "id",
            "title",
            "description",
            "category",
            "problem",
            "solution",
            "estimated_cost",
            "cost_note",
            "estimated_benefit",
            "benefit_note",
            "process",
            "process_code",
            "submitted_by",
            "submitted_by_detail",
            "status",
            "evaluation_note",
            "evaluated_by",
            "evaluated_by_detail",
            "evaluated_at",
            "implemented_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "submitted_by",
            "status",
            "evaluation_note",
            "evaluated_by",
            "evaluated_at",
            "implemented_at",
            "created_at",
            "updated_at",
        ]


class EvaluateSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, default="")


class ImprovementProjectSerializer(serializers.ModelSerializer):
    lead_detail = UserSerializer(source="lead", read_only=True)
    process_code = serializers.CharField(source="process.code", read_only=True)
    kpi_name = serializers.CharField(source="kpi.name", read_only=True)
    suggestion_title = serializers.CharField(source="suggestion.title", read_only=True)

    class Meta:
        model = ImprovementProject
        fields = [
            "id",
            "title",
            "description",
            "process",
            "process_code",
            "kpi",
            "kpi_name",
            "suggestion",
            "suggestion_title",
            "lead",
            "lead_detail",
            "team",
            "phase",
            "expected_benefit",
            "realized_benefit",
            "a3_background",
            "a3_current_state",
            "a3_goal",
            "a3_root_cause",
            "a3_countermeasures",
            "a3_follow_up",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "phase", "created_at", "updated_at"]
