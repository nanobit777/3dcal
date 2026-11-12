import type { Filament } from './types';

export function filamentLabel(filament: Pick<Filament, 'brand' | 'material' | 'colorName'>): string {
  const label = [filament.brand, filament.material, filament.colorName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
  return label || 'Filamento';
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
