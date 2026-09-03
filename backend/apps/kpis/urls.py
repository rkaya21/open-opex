from rest_framework.routers import DefaultRouter

from apps.kpis.views import KPIViewSet

router = DefaultRouter()
router.register("kpis", KPIViewSet, basename="kpi")

urlpatterns = router.urls
