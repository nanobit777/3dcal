from django.db import models


class PricingConfig(models.Model):
    electricity_clp_kwh = models.DecimalField(max_digits=10, decimal_places=2, default=200)
    printer_power_kw = models.DecimalField(max_digits=6, decimal_places=3, default=0.12)
    maintenance_per_hour_clp = models.DecimalField(max_digits=10, decimal_places=2, default=1000)
    labor_rate_clp_h = models.DecimalField(max_digits=10, decimal_places=2, default=5000)
    default_margin_pct = models.DecimalField(max_digits=5, decimal_places=2, default=40)

    class Meta:
        verbose_name = 'Configuración de precios'
        verbose_name_plural = 'Configuración de precios'

    def __str__(self):
        return 'Configuración'

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
