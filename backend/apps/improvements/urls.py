from rest_framework.routers import DefaultRouter

from apps.improvements.views import ImprovementProjectViewSet, SuggestionViewSet

router = DefaultRouter()
router.register("suggestions", SuggestionViewSet, basename="suggestion")
router.register("projects", ImprovementProjectViewSet, basename="project")

urlpatterns = router.urls
