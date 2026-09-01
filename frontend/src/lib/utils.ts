import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Timezone de Brasilia - garantir que todos os horarios exibidos sejam em GMT-3
const TZ = 'America/Sao_Paulo';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TZ,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, confirmed: boolean = true): string {
  if (!confirmed) {
    // Retorna apenas a data base sem horário
    const dateOnly = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: TZ,
    }).format(new Date(date));
    return `${dateOnly} - Aguardando confirmação`;
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(date));
}

export function formatScore(home: number | null, away: number | null): string {
  if (home === null || away === null) return 'x';
  return `${home} x ${away}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function formatTime(d: string | Date) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
}
