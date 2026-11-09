from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from core.models import PricingConfig

from .models import Filament, Quote
from .services import calculate_quote


class CalculateQuoteTests(TestCase):
    def test_calculation(self):
        result = calculate_quote(
            price_per_kg_clp=20000,
            grams=100,
            print_hours=10,
            labor_hours=1,
            extra_costs_clp=500,
            margin_pct=40,
            electricity_clp_kwh=200,
            printer_power_kw=Decimal('0.12'),
            maintenance_per_hour_clp=1000,
            labor_rate_clp_h=5000,
        )
        self.assertEqual(result['material_cost'], Decimal('2000.00'))
        self.assertEqual(result['electricity_cost'], Decimal('240.00'))
        self.assertEqual(result['labor_cost'], Decimal('5000.00'))
        self.assertEqual(result['maintenance_cost'], Decimal('10000.00'))
        self.assertEqual(result['subtotal'], Decimal('17740.00'))
        self.assertEqual(result['margin_amount'], Decimal('7096.00'))
        self.assertEqual(result['final_price'], Decimal('24836'))


class CalculatorViewTests(TestCase):
    def setUp(self):
        self.filament = Filament.objects.create(
            brand='Test',
            material='PLA',
            color_name='Negro',
            price_per_kg_clp=20000,
        )
        cfg = PricingConfig.get_solo()
        cfg.electricity_clp_kwh = Decimal('200')
        cfg.printer_power_kw = Decimal('0.12')
        cfg.maintenance_per_hour_clp = Decimal('1000')
        cfg.labor_rate_clp_h = Decimal('5000')
        cfg.default_margin_pct = Decimal('40')
        cfg.save()

    def test_pages_accessible_without_login(self):
        for name in ['calculator', 'filament_list', 'quote_history', 'settings']:
            response = self.client.get(reverse(name))
            self.assertEqual(response.status_code, 200)

    def test_calculator_saves_quote(self):
        response = self.client.post(
            reverse('calculator'),
            {
                'piece_name': 'Pieza test',
                'filament': self.filament.pk,
                'grams': '100',
                'print_hours': '10',
                'labor_hours': '1',
                'extra_costs_clp': '500',
                'margin_pct': '40',
                'save_to_history': 'on',
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Quote.objects.filter(piece_name='Pieza test').exists())
        quote = Quote.objects.get(piece_name='Pieza test')
        self.assertEqual(quote.final_price_clp, Decimal('24836.00'))

    def test_filament_create(self):
        response = self.client.post(
            reverse('filament_create'),
            {
                'brand': 'Nuevo',
                'material': 'PETG',
                'color_name': 'Blanco',
                'price_per_kg_clp': '15000',
                'active': 'on',
                'notes': '',
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Filament.objects.filter(brand='Nuevo').exists())
