from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.processes.models import Process


class ProcessSerializer(serializers.ModelSerializer):
    owner_detail = UserSerializer(source="owner", read_only=True)
    children_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Process
        fields = [
            "id",
            "name",
            "code",
            "parent",
            "owner",
            "owner_detail",
            "status",
            "version",
            "purpose",
            "suppliers",
            "inputs",
            "steps",
            "outputs",
            "customers",
            "children_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "version", "created_at", "updated_at"]

    def validate(self, attrs):
        """Run model-level clean (cycle prevention) with the incoming parent."""
        instance = self.instance or Process(**attrs)
        if self.instance is not None:
            instance = Process(
                pk=self.instance.pk,
                parent=attrs.get("parent", self.instance.parent),
            )
        try:
            instance.clean()
        except Exception as exc:  # ValidationError from model clean
            detail = getattr(exc, "message_dict", None) or {"parent": str(exc)}
            raise serializers.ValidationError(detail) from exc
        return attrs


def build_process_tree(processes) -> list[dict]:
    """Build the full hierarchy in memory from a single queryset.

    Avoids recursive per-node queries and supports arbitrary depth. Input
    must be ordered (e.g. by code); children keep that order.
    """
    nodes = {
        process.id: {
            "id": process.id,
            "name": process.name,
            "code": process.code,
            "status": process.status,
            "version": process.version,
            "owner": process.owner_id,
            "children": [],
        }
        for process in processes
    }
    roots: list[dict] = []
    for process in processes:
        node = nodes[process.id]
        if process.parent_id and process.parent_id in nodes:
            nodes[process.parent_id]["children"].append(node)
        else:
            roots.append(node)
    return roots
