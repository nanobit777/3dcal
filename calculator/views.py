from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from core.models import PricingConfig

from .forms import CalculatorForm, FilamentForm, PricingConfigForm
from .models import Filament, Quote
from .services import calculate_quote


def calculator(request):
    cfg = PricingConfig.get_solo()
    result = None
    quote = None
    if request.method == 'POST':
        form = CalculatorForm(request.POST, cfg=cfg)
        if form.is_valid():
            data = form.cleaned_data
            filament = data['filament']
            result = calculate_quote(
                price_per_kg_clp=filament.price_per_kg_clp,
                grams=data['grams'],
                print_hours=data['print_hours'],
                labor_hours=data['labor_hours'],
                extra_costs_clp=data['extra_costs_clp'],
                margin_pct=data['margin_pct'],
                electricity_clp_kwh=cfg.electricity_clp_kwh,
                printer_power_kw=cfg.printer_power_kw,
                maintenance_per_hour_clp=cfg.maintenance_per_hour_clp,
                labor_rate_clp_h=cfg.labor_rate_clp_h,
            )
            if data['save_to_history']:
                quote = Quote.objects.create(
                    piece_name=data['piece_name'],
                    filament=filament,
                    filament_name=str(filament),
                    price_per_kg_clp=filament.price_per_kg_clp,
                    grams=data['grams'],
                    print_hours=data['print_hours'],
                    labor_hours=data['labor_hours'],
                    electricity_clp_kwh=cfg.electricity_clp_kwh,
                    printer_power_kw=cfg.printer_power_kw,
                    maintenance_per_hour_clp=cfg.maintenance_per_hour_clp,
                    labor_rate_clp_h=cfg.labor_rate_clp_h,
                    extra_costs_clp=data['extra_costs_clp'],
                    margin_pct=data['margin_pct'],
                    material_cost_clp=result['material_cost'],
                    electricity_cost_clp=result['electricity_cost'],
                    labor_cost_clp=result['labor_cost'],
                    maintenance_cost_clp=result['maintenance_cost'],
                    subtotal_cost_clp=result['subtotal'],
                    margin_amount_clp=result['margin_amount'],
                    final_price_clp=result['final_price'],
                )
    else:
        form = CalculatorForm(cfg=cfg)

    return render(
        request,
        'calculator/calculator.html',
        {
            'form': form,
            'result': result,
            'quote': quote,
            'cfg': cfg,
            'has_filaments': Filament.objects.filter(active=True).exists(),
        },
    )


def filament_list(request):
    filaments = Filament.objects.all()
    return render(request, 'calculator/catalog.html', {'filaments': filaments})


def filament_create(request):
    if request.method == 'POST':
        form = FilamentForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect(f"{reverse('filament_list')}?ok=creado")
    else:
        form = FilamentForm()
    return render(
        request,
        'calculator/filament_form.html',
        {'form': form, 'title': 'Nuevo filamento'},
    )


def filament_edit(request, pk):
    filament = get_object_or_404(Filament, pk=pk)
    if request.method == 'POST':
        form = FilamentForm(request.POST, instance=filament)
        if form.is_valid():
            form.save()
            return redirect(f"{reverse('filament_list')}?ok=editado")
    else:
        form = FilamentForm(instance=filament)
    return render(
        request,
        'calculator/filament_form.html',
        {'form': form, 'title': 'Editar filamento', 'filament': filament},
    )


@require_POST
def filament_delete(request, pk):
    filament = get_object_or_404(Filament, pk=pk)
    filament.delete()
    return redirect(f"{reverse('filament_list')}?ok=eliminado")


def quote_history(request):
    quotes = Quote.objects.select_related('filament')
    query = request.GET.get('q', '').strip()
    if query:
        quotes = quotes.filter(
            Q(piece_name__icontains=query) | Q(filament_name__icontains=query)
        )
    paginator = Paginator(quotes, 20)
    page_obj = paginator.get_page(request.GET.get('page'))
    return render(
        request,
        'calculator/history.html',
        {'page_obj': page_obj, 'quotes': page_obj, 'query': query},
    )


def quote_detail(request, pk):
    quote = get_object_or_404(Quote, pk=pk)
    return render(request, 'calculator/quote_detail.html', {'quote': quote})


@require_POST
def quote_delete(request, pk):
    quote = get_object_or_404(Quote, pk=pk)
    quote.delete()
    return redirect(f"{reverse('quote_history')}?ok=eliminado")


def settings_view(request):
    cfg = PricingConfig.get_solo()
    if request.method == 'POST':
        form = PricingConfigForm(request.POST, instance=cfg)
        if form.is_valid():
            form.save()
            return redirect(f"{reverse('settings')}?ok=guardado")
    else:
        form = PricingConfigForm(instance=cfg)
    return render(request, 'calculator/settings.html', {'form': form, 'cfg': cfg})
