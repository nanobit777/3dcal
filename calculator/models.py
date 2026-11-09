from decimal import Decimal

from django.db import models
from django.utils import timezone

MATERIAL_CHOICES = [
    ('PLA', 'PLA'),
    ('PLA+', 'PLA+'),
    ('PETG', 'PETG'),
    ('ABS', 'ABS'),
    ('TPU', 'TPU'),
    ('OTRO', 'Otro'),
]


class Filament(models.Model):
    brand = models.CharField(max_length=80, blank=True)
    material = models.CharField(max_length=10, choices=MATERIAL_CHOICES, blank=True)
    color_name = models.CharField(max_length=80, blank=True)
    price_per_kg_clp = models.PositiveIntegerField(help_text='Precio del kilo de filamento en CLP')
    active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    legacy_ref = models.CharField(max_length=60, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['brand', 'material', 'color_name']
        verbose_name = 'Filamento'
        verbose_name_plural = 'Filamentos'

    def __str__(self):
        name = ' '.join(part for part in [self.brand, self.material, self.color_name] if part)
        return name or f'Filamento #{self.pk}'

    @property
    def price_per_gram(self):
        return Decimal(self.price_per_kg_clp) / Decimal('1000')


class Quote(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    quote_date = models.DateField(default=timezone.localdate)
    piece_name = models.CharField(max_length=160, blank=True)
    filament = models.ForeignKey(
        Filament, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotes'
    )
    filament_name = models.CharField(max_length=160)
    price_per_kg_clp = models.DecimalField(max_digits=12, decimal_places=2)
    grams = models.DecimalField(max_digits=10, decimal_places=2)
    print_hours = models.DecimalField(max_digits=8, decimal_places=2)
    labor_hours = models.DecimalField(max_digits=8, decimal_places=2)
    electricity_clp_kwh = models.DecimalField(max_digits=10, decimal_places=2)
    printer_power_kw = models.DecimalField(max_digits=6, decimal_places=3)
    maintenance_per_hour_clp = models.DecimalField(max_digits=10, decimal_places=2)
    labor_rate_clp_h = models.DecimalField(max_digits=10, decimal_places=2)
    extra_costs_clp = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    margin_pct = models.DecimalField(max_digits=5, decimal_places=2)
    material_cost_clp = models.DecimalField(max_digits=12, decimal_places=2)
    electricity_cost_clp = models.DecimalField(max_digits=12, decimal_places=2)
    labor_cost_clp = models.DecimalField(max_digits=12, decimal_places=2)
    maintenance_cost_clp = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal_cost_clp = models.DecimalField(max_digits=12, decimal_places=2)
    margin_amount_clp = models.DecimalField(max_digits=12, decimal_places=2)
    final_price_clp = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True)
    imported_legacy = models.BooleanField(default=False)
    legacy_ref = models.CharField(max_length=60, blank=True)

    class Meta:
        ordering = ['-created_at', '-id']
        verbose_name = 'Cotización'
        verbose_name_plural = 'Cotizaciones'

    def __str__(self):
        return self.piece_name or f'Cotización #{self.pk}'
