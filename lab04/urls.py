from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("districts.urls")),
]
path("api/where/", views.district_at, name="district-at"),