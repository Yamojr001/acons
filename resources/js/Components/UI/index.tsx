import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Button ──────────────────────────────────────────────────────────────────
type ButtonHTMLProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>
interface ButtonProps extends ButtonHTMLProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'warning' | 'brand' | 'neutral' | 'white'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconLeft?: ReactNode
  iconRight?: ReactNode
  as?: 'button' | 'span'
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconLeft, iconRight, children, className, disabled, as = 'button', ...props }, ref) => {
    const v = {
      primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm focus-visible:outline-brand-500',
      secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300',
      danger:    'bg-danger-500 text-white hover:bg-danger-600 shadow-sm',
      ghost:     'bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-800',
      outline:   'border border-surface-300 text-surface-700 hover:bg-surface-50 hover:border-surface-400',
      success:   'bg-success-500 text-white hover:bg-success-600 shadow-sm',
      warning:   'bg-warning-500 text-white hover:bg-warning-600 shadow-sm',
      brand:     'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm focus-visible:outline-brand-500',
      neutral:   'bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300',
      white:     'bg-white text-surface-700 hover:bg-surface-50 shadow-sm border border-surface-200',
    }
    const s = {
      xs: 'px-2.5 py-1 text-xs rounded-md gap-1',
      sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
      lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
    }
    const MotionTag = as === 'span' ? motion.span : motion.button
    return (
      <MotionTag
        ref={ref as any}
        whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn('inline-flex items-center justify-center font-medium select-none cursor-pointer transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none', v[variant], s[size], className)}
        {...(as === 'button' ? { disabled: disabled || loading } : {})}
        {...(props as any)}
      >
        {loading ? <Loader2 className="animate-spin" size={size === 'sm' || size === 'xs' ? 12 : size === 'lg' ? 18 : 14} /> : (iconLeft ?? icon)}
        {children}
        {!loading && iconRight}
      </MotionTag>
    )
  }
)
Button.displayName = 'Button'

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string; label?: string; hint?: string; leftIcon?: ReactNode; rightIcon?: ReactNode
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>}
        <div className="relative">
          {leftIcon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">{leftIcon}</span>}
          <input ref={ref} id={inputId}
            className={cn('block w-full rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-150 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 focus:outline-none disabled:bg-surface-50 disabled:opacity-60',
              leftIcon && 'pl-10', rightIcon && 'pr-10',
              error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-400/20', className)}
            {...props}
          />
          {rightIcon && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400">{rightIcon}</span>}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger-500">⚠ {error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-surface-500">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Card ─────────────────────────────────────────────────────────────────────
type CardHTMLProps = Omit<HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>
interface CardProps extends CardHTMLProps { hover?: boolean; padding?: 'none' | 'sm' | 'md' | 'lg' }
export const Card = ({ hover, padding = 'md', children, className, ...props }: CardProps) => {
  const p = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.4,0,0.2,1] }}
      className={cn('bg-white rounded-2xl border border-surface-200 shadow-card', hover && 'transition-all duration-250 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer', p[padding], className)}
      {...(props as any)}>{children}
    </motion.div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  variant?: 'success'|'warning'|'danger'|'brand'|'neutral'|'info'|'outline'|'primary'|'secondary'|'ghost'
  size?: 'sm' | 'md'
  dot?: boolean; children: ReactNode; className?: string
}
export const Badge = ({ variant = 'neutral', size = 'md', dot, children, className }: BadgeProps) => {
  const v = {
    success: 'bg-success-100 text-success-700', warning: 'bg-warning-50 text-warning-600', danger: 'bg-danger-100 text-danger-600',
    brand: 'bg-brand-100 text-brand-700', neutral: 'bg-surface-100 text-surface-600', info: 'bg-blue-100 text-blue-700',
    outline: 'bg-transparent border border-surface-300 text-surface-600', primary: 'bg-brand-100 text-brand-700',
    secondary: 'bg-surface-100 text-surface-700', ghost: 'bg-transparent text-surface-600',
  }
  const d = {
    success: 'bg-success-500', warning: 'bg-warning-500', danger: 'bg-danger-500', brand: 'bg-brand-500', neutral: 'bg-surface-400',
    info: 'bg-blue-500', outline: 'bg-surface-400', primary: 'bg-brand-500', secondary: 'bg-surface-400', ghost: 'bg-surface-400',
  }
  const sizeClass = size === 'sm' ? 'px-2 py-0 text-[10px]' : 'px-2.5 py-0.5 text-xs'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', sizeClass, v[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', d[variant])} />}{children}
    </span>
  )
}

// ─── NairaIcon ───────────────────────────────────────────────────────────────
// lucide-react has no ₦ glyph; this mimics its sizing so it drops into icon slots.
interface NairaIconProps { size?: number; className?: string }
export const NairaIcon = ({ size = 17, className }: NairaIconProps) => (
  <span
    className={cn('inline-flex items-center justify-center leading-none font-bold', className)}
    style={{ width: size, height: size, fontSize: Math.round(size * 0.85) }}
  >
    ₦
  </span>
)

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps { name: string; src?: string | null; size?: 'xs'|'sm'|'md'|'lg'|'xl'; className?: string }
export const Avatar = ({ name, src, size = 'md', className }: AvatarProps) => {
  const s = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['bg-brand-500','bg-success-500','bg-amber-500','bg-purple-500','bg-pink-500','bg-teal-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover', s[size], className)} />
  return <div className={cn('rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0', color, s[size], className)}>{initials}</div>
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps { title: string; value: string|number; change?: number; icon: ReactNode; color?: 'brand'|'success'|'warning'|'danger'; loading?: boolean; delay?: number }
export const StatCard = ({ title, value, change, icon, color = 'brand', loading, delay = 0 }: StatCardProps) => {
  const colorStyles = {
    brand: { bg: 'bg-brand-50', icon: 'text-brand-600', ring: 'ring-brand-100' },
    success: { bg: 'bg-success-50', icon: 'text-success-600', ring: 'ring-success-100' },
    warning: { bg: 'bg-warning-50', icon: 'text-warning-600', ring: 'ring-warning-100' },
    danger: { bg: 'bg-danger-50', icon: 'text-danger-600', ring: 'ring-danger-100' },
  }
  const c = colorStyles[color] ?? colorStyles.brand
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: [0.4,0,0.2,1] }}
      className="bg-white rounded-2xl border border-surface-200 shadow-card p-5 flex items-start gap-4 hover:shadow-card-hover transition-shadow duration-250">
      <div className={cn('p-3 rounded-2xl ring-1 flex-shrink-0', c.bg, c.ring)}><span className={cn('block', c.icon)}>{icon}</span></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-500 font-medium mb-0.5">{title}</p>
        {loading ? <div className="h-7 w-24 rounded-lg bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 animate-shimmer" /> : <p className="text-2xl font-display font-bold text-surface-900">{value}</p>}
        {typeof change !== 'undefined' && !loading && (
          <p className={cn('text-xs mt-1 font-medium', change >= 0 ? 'text-success-600' : 'text-danger-500')}>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month</p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Alert ────────────────────────────────────────────────────────────────────
interface AlertProps { variant?: 'success'|'warning'|'danger'|'info'; title?: string; children: ReactNode; className?: string; onDismiss?: () => void }
export const Alert = ({ variant = 'info', title, children, className, onDismiss }: AlertProps) => {
  const s = { success: 'bg-success-50 border-success-200 text-success-800', warning: 'bg-warning-50 border-warning-200 text-warning-800', danger: 'bg-danger-50 border-danger-200 text-danger-700', info: 'bg-blue-50 border-blue-200 text-blue-800' }
  const icons = { success: '✓', warning: '⚠', danger: '✕', info: 'ℹ' }
  return (
    <div className={cn('border rounded-xl p-4 flex gap-3', s[variant], className)}>
      <span className="text-base leading-5 flex-shrink-0">{icons[variant]}</span>
      <div className="flex-1 min-w-0">{title && <p className="font-semibold text-sm mb-0.5">{title}</p>}<p className="text-sm">{children}</p></div>
      {onDismiss && <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100 transition-opacity flex-shrink-0">✕</button>}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps { icon?: ReactNode; title: string; description?: string; action?: ReactNode }
export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center text-surface-400 mb-4">{icon}</div>}
    <h3 className="text-base font-semibold text-surface-800 mb-1">{title}</h3>
    {description && <p className="text-sm text-surface-500 max-w-sm mb-5">{description}</p>}
    {action}
  </div>
)

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20, className }: { size?: number; className?: string }) => (
  <Loader2 size={size} className={cn('animate-spin text-brand-500', className)} />
)

// ─── SearchInput ──────────────────────────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder = 'Search…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) => (
  <div className={cn('relative', className)}>
    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
    <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="block w-full rounded-xl border border-surface-300 bg-white pl-10 pr-4 py-2 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-150 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 focus:outline-none" />
  </div>
)
