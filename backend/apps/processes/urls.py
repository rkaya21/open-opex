from rest_framework.routers import DefaultRouter

from apps.processes.views import ProcessViewSet

router = DefaultRouter()
router.register("processes", ProcessViewSet, basename="process")

urlpatterns = router.urls
