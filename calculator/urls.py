from django.urls import path

from . import views

urlpatterns = [
    path('', views.calculator, name='calculator'),
    path('filamentos/', views.filament_list, name='filament_list'),
    path('filamentos/nuevo/', views.filament_create, name='filament_create'),
    path('filamentos/<int:pk>/editar/', views.filament_edit, name='filament_edit'),
    path('filamentos/<int:pk>/eliminar/', views.filament_delete, name='filament_delete'),
    path('historial/', views.quote_history, name='quote_history'),
    path('historial/<int:pk>/', views.quote_detail, name='quote_detail'),
    path('historial/<int:pk>/eliminar/', views.quote_delete, name='quote_delete'),
    path('configuracion/', views.settings_view, name='settings'),
]
