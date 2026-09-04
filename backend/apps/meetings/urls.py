from rest_framework.routers import DefaultRouter

from apps.meetings.views import AsakaiItemViewSet, AsakaiMeetingViewSet

router = DefaultRouter()
router.register("asakai", AsakaiMeetingViewSet, basename="asakai")
router.register("asakai-items", AsakaiItemViewSet, basename="asakai-item")

urlpatterns = router.urls
