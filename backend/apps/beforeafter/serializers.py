from rest_framework import serializers

from apps.beforeafter.models import BeforeAfterForm, BeforeAfterPhoto


class BeforeAfterPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeforeAfterPhoto
        fields = ["id", "form", "kind", "image", "caption", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        form = attrs.get("form")
        kind = attrs.get("kind")
        if form and kind:
            existing = form.photos.filter(kind=kind).count()
            if existing >= BeforeAfterPhoto.MAX_PER_KIND:
                raise serializers.ValidationError(
                    {"image": f"En fazla {BeforeAfterPhoto.MAX_PER_KIND} fotoğraf eklenebilir."}
                )
        return attrs


class BeforeAfterFormSerializer(serializers.ModelSerializer):
    photos = BeforeAfterPhotoSerializer(many=True, read_only=True)
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    gain_category_label = serializers.CharField(
        source="get_gain_category_display", read_only=True
    )
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)
    process_code = serializers.CharField(source="process.code", read_only=True)

    class Meta:
        model = BeforeAfterForm
        fields = [
            "id",
            "start_date",
            "end_date",
            "category",
            "category_label",
            "problem",
            "before_note",
            "after_note",
            "cost",
            "cost_note",
            "budget_code",
            "gain_continuity",
            "one_time_gain",
            "gain_note",
            "gain_category",
            "gain_category_label",
            "process",
            "process_code",
            "photos",
            "created_by",
            "created_by_email",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]
