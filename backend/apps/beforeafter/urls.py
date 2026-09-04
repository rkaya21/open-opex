from rest_framework.routers import DefaultRouter

from apps.beforeafter.views import BeforeAfterFormViewSet, BeforeAfterPhotoViewSet

router = DefaultRouter()
router.register("beforeafter", BeforeAfterFormViewSet, basename="beforeafter")
router.register(
    "beforeafter-photos", BeforeAfterPhotoViewSet, basename="beforeafter-photo"
)

urlpatterns = router.urls
