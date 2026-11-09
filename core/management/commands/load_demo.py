from decimal import Decimal

from django.core.management.base import BaseCommand

from calculator.models import Filament, Quote
from calculator.services import calculate_quote
from core.models import PricingConfig


class Command(BaseCommand):
    help = 'Carga datos de demostración para la calculadora'

    def handle(self, *args, **options):
        cfg = PricingConfig.get_solo()

        filament, _ = Filament.objects.get_or_create(
            legacy_ref='demo-filament',
            defaults={
                'brand': 'Genérico',
                'material': 'PLA',
                'color_name': 'Negro',
                'price_per_kg_clp': 12990,
            },
        )

        result = calculate_quote(
            price_per_kg_clp=filament.price_per_kg_clp,
            grams=Decimal('80'),
            print_hours=Decimal('8.5'),
            labor_hours=Decimal('0.5'),
            extra_costs_clp=Decimal('500'),
            margin_pct=cfg.default_margin_pct,
            electricity_clp_kwh=cfg.electricity_clp_kwh,
            printer_power_kw=cfg.printer_power_kw,
            maintenance_per_hour_clp=cfg.maintenance_per_hour_clp,
            labor_rate_clp_h=cfg.labor_rate_clp_h,
        )

        Quote.objects.get_or_create(
            legacy_ref='demo-quote',
            defaults={
                'piece_name': 'Pieza de ejemplo',
                'filament': filament,
                'filament_name': str(filament),
                'price_per_kg_clp': filament.price_per_kg_clp,
                'grams': Decimal('80'),
                'print_hours': Decimal('8.5'),
                'labor_hours': Decimal('0.5'),
                'electricity_clp_kwh': cfg.electricity_clp_kwh,
                'printer_power_kw': cfg.printer_power_kw,
                'maintenance_per_hour_clp': cfg.maintenance_per_hour_clp,
                'labor_rate_clp_h': cfg.labor_rate_clp_h,
                'extra_costs_clp': Decimal('500'),
                'margin_pct': cfg.default_margin_pct,
                'material_cost_clp': result['material_cost'],
                'electricity_cost_clp': result['electricity_cost'],
                'labor_cost_clp': result['labor_cost'],
                'maintenance_cost_clp': result['maintenance_cost'],
                'subtotal_cost_clp': result['subtotal'],
                'margin_amount_clp': result['margin_amount'],
                'final_price_clp': result['final_price'],
            },
        )

        self.stdout.write(self.style.SUCCESS('Datos de demostración cargados'))
