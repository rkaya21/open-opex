from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.actions.views import ActionViewSet, MyWorkView

router = DefaultRouter()
router.register("actions", ActionViewSet, basename="action")

urlpatterns = [
    path("my-work/", MyWorkView.as_view(), name="my-work"),
    *router.urls,
]
