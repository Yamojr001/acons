// ─── Modal ───────────────────────────────────────────────────────────────────
import { ReactNode, useEffect, useRef, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: ReactNode
  footer?: ReactNode
  closeOnOverlay?: boolean
}

export function Modal({ isOpen, onClose, title, description, size = 'md', children, footer, closeOnOverlay = true }: ModalProps) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={cn('relative bg-white rounded-2xl shadow-dialog w-full flex flex-col max-h-[90vh]', sizes[size])}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between px-6 py-5 border-b border-surface-100 flex-shrink-0">
                <div>
                  {title && <h2 className="text-lg font-semibold text-surface-900">{title}</h2>}
                  {description && <p className="text-sm text-surface-500 mt-0.5">{description}</p>}
                </div>
                <button onClick={onClose} className="p-1.5 rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors ml-4 flex-shrink-0">
                  <X size={18} />
                </button>
              </div>
            )}
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
            {/* Footer */}
            {footer && <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 flex-shrink-0">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading }: ConfirmDialogProps) {
  const btnClass = variant === 'danger'
    ? 'bg-danger-500 hover:bg-danger-600 text-white'
    : 'bg-warning-500 hover:bg-warning-600 text-white'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title}
      footer={
        <>
          <button onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={cn('btn btn-sm', btnClass, loading && 'opacity-60 cursor-not-allowed')}>
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </>
      }>
      <p className="text-sm text-surface-600">{message}</p>
    </Modal>
  )
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6"
    >
      <div>
        {breadcrumbs && (
          <nav className="flex items-center gap-1.5 text-xs text-surface-400 mb-1.5">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-brand-600 transition-colors">{crumb.label}</a>
                ) : (
                  <span className="text-surface-600">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
interface SkeletonProps { className?: string; lines?: number; card?: boolean }

export function Skeleton({ className, lines = 1, card }: SkeletonProps) {
  if (card) return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="skeleton h-8 w-2/3 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  )
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('skeleton h-4 rounded', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  )
}

// ─── FileUpload ───────────────────────────────────────────────────────────────
interface FileUploadProps {
  accept?: string
  maxSize?: number // MB
  onUpload: (file: File) => void
  preview?: string | null
  label?: string
  description?: string
  className?: string
}

export function FileUpload({ accept = 'image/*', maxSize = 2, onUpload, preview, label = 'Upload file', description, className }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > maxSize * 1024 * 1024) { alert(`File must be under ${maxSize}MB`); return }
    onUpload(file)
  }

  return (
    <div
      className={cn('border-2 border-dashed border-surface-300 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all duration-200', className)}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-brand-400', 'bg-brand-50') }}
      onDragLeave={e => e.currentTarget.classList.remove('border-brand-400', 'bg-brand-50')}
      onDrop={e => {
        e.preventDefault()
        e.currentTarget.classList.remove('border-brand-400', 'bg-brand-50')
        const file = e.dataTransfer.files?.[0]
        if (file) { onUpload(file) }
      }}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="h-20 mx-auto mb-3 object-contain rounded-xl" />
      ) : (
        <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">📁</span>
        </div>
      )}
      <p className="text-sm font-medium text-surface-700">{label}</p>
      {description && <p className="text-xs text-surface-400 mt-1">{description}</p>}
      <p className="text-xs text-surface-400 mt-1">Max {maxSize}MB · Drag & drop or click</p>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
interface TimelineEvent {
  id: string | number
  title: string
  description?: string
  time: string
  icon?: ReactNode
  color?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const colors = {
    brand: 'bg-brand-500 ring-brand-100',
    success: 'bg-success-500 ring-success-100',
    warning: 'bg-warning-500 ring-warning-100',
    danger: 'bg-danger-500 ring-danger-100',
    neutral: 'bg-surface-400 ring-surface-100',
  }
  return (
    <div className="space-y-4">
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-3"
        >
          <div className="relative flex flex-col items-center">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ring-4 flex-shrink-0', colors[event.color ?? 'neutral'])}>
              {event.icon ?? <span>•</span>}
            </div>
            {i < events.length - 1 && <div className="w-px flex-1 bg-surface-200 my-1" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-surface-900">{event.title}</p>
              <span className="text-xs text-surface-400 flex-shrink-0">{event.time}</span>
            </div>
            {event.description && <p className="text-xs text-surface-500 mt-0.5">{event.description}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── DataTable ────────────────────────────────────────────────────────────────
export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => ReactNode
  className?: string
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: keyof T
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  onRowClick?: (row: T) => void
}

export function DataTable<T extends Record<string, any>>({ columns, data, rowKey, loading, emptyTitle = 'No data', emptyDescription, emptyIcon, onRowClick }: DataTableProps<T>) {
  if (loading) return (
    <div className="divide-y divide-surface-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="skeleton h-9 w-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-3 w-1/4 rounded" />
          </div>
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )

  if (!data.length) return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {emptyIcon && <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center text-surface-400 mb-4">{emptyIcon}</div>}
      <h3 className="text-base font-semibold text-surface-800 mb-1">{emptyTitle}</h3>
      {emptyDescription && <p className="text-sm text-surface-500 max-w-sm">{emptyDescription}</p>}
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-50 border-b border-surface-200">
            {columns.map(col => (
              <th key={String(col.key)} className={cn('table-head text-left', col.className)}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <motion.tr
              key={String(row[rowKey])}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn('table-row', onRowClick && 'cursor-pointer')}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td key={String(col.key)} className={cn('table-cell', col.className)}>
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '—')}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
interface Tab { id: string; label: string; icon?: ReactNode; badge?: string | number }

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  variant?: 'pill' | 'underline'
}

export function Tabs({ tabs, active, onChange, variant = 'pill' }: TabsProps) {
  if (variant === 'underline') return (
    <div className="flex gap-0 border-b border-surface-200 mb-6">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all',
            active === tab.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
          )}>
          {tab.icon}{tab.label}
          {tab.badge !== undefined && <span className="bg-surface-200 text-surface-600 text-xs rounded-full px-1.5 py-0.5">{tab.badge}</span>}
        </button>
      ))}
    </div>
  )
  return (
    <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit mb-6 flex-wrap">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            active === tab.id ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          )}>
          {tab.icon}{tab.label}
          {tab.badge !== undefined && <span className="bg-brand-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{tab.badge}</span>}
        </button>
      ))}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
import { Link } from '@inertiajs/react'

interface PaginationLink { url: string | null; label: string; active: boolean }

export function Pagination({ links, from, to, total }: { links: PaginationLink[]; from: number | null; to: number | null; total: number }) {
  if (links.length <= 3) return null
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
      <p className="text-sm text-surface-500">Showing {from ?? 0}–{to ?? 0} of {total.toLocaleString()}</p>
      <div className="flex gap-1">
        {links.map((link, i) => (
          link.url ? (
            <Link key={i} href={link.url}
              className={cn('px-3 py-1.5 text-sm rounded-lg transition-colors',
                link.active ? 'bg-brand-500 text-white' : 'hover:bg-surface-100 text-surface-600'
              )}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ) : (
            <span key={i} className="px-3 py-1.5 text-sm text-surface-300" dangerouslySetInnerHTML={{ __html: link.label }} />
          )
        ))}
      </div>
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: Array<{ value: string | number; label: string }>
  placeholder?: string
}

export function Select({ label, error, hint, options, placeholder, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <select id={inputId} className={cn('input appearance-none', error && 'input-error', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {error && <p className="mt-1.5 text-xs text-danger-500">⚠ {error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-surface-500">{hint}</p>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <textarea id={inputId} className={cn('input resize-none', error && 'input-error', className)} rows={4} {...props} />
      {error && <p className="mt-1.5 text-xs text-danger-500">⚠ {error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-surface-500">{hint}</p>}
    </div>
  )
}

// ─── Toggle / Switch ──────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <div className="relative flex-shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
        <div className={cn('w-11 h-6 rounded-full transition-colors duration-200', checked ? 'bg-brand-500' : 'bg-surface-300')} />
        <motion.div
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </div>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-surface-800">{label}</p>}
          {description && <p className="text-xs text-surface-500">{description}</p>}
        </div>
      )}
    </label>
  )
}

// ─── SearchInput ──────────────────────────────────────────────────────────────
import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10 py-2 text-sm"
      />
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <div className="relative">
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">{leftIcon}</div>}
          <input
            id={inputId}
            ref={ref}
            className={cn('input', leftIcon && 'pl-10', rightIcon && 'pr-10', error && 'input-error', className)}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 flex items-center justify-center">{rightIcon}</div>}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger-500">⚠ {error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-surface-500">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
