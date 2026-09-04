from rest_framework import serializers

from apps.lessons.models import OnePointLesson


class OnePointLessonSerializer(serializers.ModelSerializer):
    trainer_email = serializers.CharField(source="trainer.email", read_only=True)
    participant_emails = serializers.SlugRelatedField(
        source="participants", slug_field="email", many=True, read_only=True
    )
    process_code = serializers.CharField(source="process.code", read_only=True)
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = OnePointLesson
        fields = [
            "id",
            "trainer",
            "trainer_email",
            "category",
            "category_label",
            "topic",
            "content",
            "held_at",
            "duration_minutes",
            "participants",
            "participant_emails",
            "process",
            "process_code",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]

    def validate_participants(self, value):
        if len(value) < OnePointLesson.MIN_PARTICIPANTS:
            raise serializers.ValidationError(
                f"En az {OnePointLesson.MIN_PARTICIPANTS} katılımcı seçilmelidir."
            )
        return value
