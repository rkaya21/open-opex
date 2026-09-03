from rest_framework.routers import DefaultRouter

from apps.audits.views import (
    AreaViewSet,
    AuditViewSet,
    ChecklistTemplateViewSet,
    FindingViewSet,
)

router = DefaultRouter()
router.register("areas", AreaViewSet, basename="area")
router.register("checklists", ChecklistTemplateViewSet, basename="checklist")
router.register("audits", AuditViewSet, basename="audit")
router.register("findings", FindingViewSet, basename="finding")

urlpatterns = router.urls
