from decimal import Decimal

from django import forms

from core.models import PricingConfig

from .models import Filament


class BootstrapFormMixin:
    def _apply_bootstrap(self):
        for field in self.fields.values():
            widget = field.widget
            if isinstance(widget, forms.CheckboxInput):
                widget.attrs.setdefault('class', 'form-check-input')
            elif isinstance(widget, forms.Select):
                widget.attrs.setdefault('class', 'form-select')
            else:
                widget.attrs.setdefault('class', 'form-control')


class FilamentForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Filament
        fields = ['brand', 'material', 'color_name', 'price_per_kg_clp', 'active', 'notes']
        widgets = {'notes': forms.Textarea(attrs={'rows': 3})}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._apply_bootstrap()


class CalculatorForm(BootstrapFormMixin, forms.Form):
    piece_name = forms.CharField(required=False, max_length=160, label='Nombre de la pieza')
    filament = forms.ModelChoiceField(
        queryset=Filament.objects.none(),
        label='Filamento',
        empty_label='Selecciona un filamento',
    )
    grams = forms.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal('0.01'), label='Gramos usados'
    )
    print_hours = forms.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal('0'), label='Horas de impresión'
    )
    labor_hours = forms.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal('0'), initial=Decimal('0'),
        label='Horas de trabajo',
    )
    extra_costs_clp = forms.DecimalField(
        max_digits=12, decimal_places=2, min_value=Decimal('0'), initial=Decimal('0'),
        label='Costos extra (CLP)',
    )
    margin_pct = forms.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal('0'), initial=Decimal('40'),
        label='Margen de ganancia (%)',
    )
    save_to_history = forms.BooleanField(
        required=False, initial=True, label='Guardar en historial'
    )

    def __init__(self, *args, cfg=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['filament'].queryset = Filament.objects.filter(active=True)
        if cfg is not None and not self.is_bound:
            self.fields['margin_pct'].initial = cfg.default_margin_pct
        self._apply_bootstrap()


class PricingConfigForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = PricingConfig
        fields = [
            'electricity_clp_kwh',
            'printer_power_kw',
            'maintenance_per_hour_clp',
            'labor_rate_clp_h',
            'default_margin_pct',
        ]
        labels = {
            'electricity_clp_kwh': 'Precio de la luz (CLP/kWh)',
            'printer_power_kw': 'Potencia de la impresora (kW)',
            'maintenance_per_hour_clp': 'Mantenimiento/depreciación (CLP/hora)',
            'labor_rate_clp_h': 'Mano de obra (CLP/hora)',
            'default_margin_pct': 'Margen por defecto (%)',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._apply_bootstrap()
