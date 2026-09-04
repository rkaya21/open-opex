from rest_framework.routers import DefaultRouter

from apps.lessons.views import OnePointLessonViewSet

router = DefaultRouter()
router.register("lessons", OnePointLessonViewSet, basename="lesson")

urlpatterns = router.urls
