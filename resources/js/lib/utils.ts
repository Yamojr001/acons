import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaults: Intl.DateTimeFormatOptions = options?.dateStyle ? {} : { year: 'numeric', month: 'short', day: 'numeric' }
  return new Intl.DateTimeFormat('en-NG', {
    ...defaults, ...options,
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return formatDate(date)
}

export function statusColor(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'brand' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'brand'> = {
    active: 'success', paid: 'success', successful: 'success', present: 'success', verified: 'success',
    pending: 'warning', partial: 'warning', late: 'warning', inactive: 'warning',
    overdue: 'danger', suspended: 'danger', failed: 'danger', absent: 'danger', danger: 'danger',
    graduated: 'brand', withdrawn: 'neutral', refunded: 'neutral', excused: 'neutral',
  }
  return map[status] ?? 'neutral'
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export function truncate(text: string, length = 60): string {
  return text.length <= length ? text : text.slice(0, length) + '…'
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// Framer Motion variants
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8 },
}
