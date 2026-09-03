from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import MeView, UserListView

urlpatterns = [
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("users/", UserListView.as_view(), name="user-list"),
]
