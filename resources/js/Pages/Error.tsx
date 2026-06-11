import { useEffect } from 'react'
import { usePage, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import type { PageProps } from '@/types'

// ─── Flash Toast System ───────────────────────────────────────────────────────
export function FlashNotifications() {
  const { flash } = usePage<PageProps>().props

  useEffect(() => {
    const show = (message: string, variant: 'success' | 'error' | 'warning' | 'info') => {
      const icons = { success: <CheckCircle2 size={17} className="text-success-500" />, error: <XCircle size={17} className="text-danger-500" />, warning: <AlertTriangle size={17} className="text-warning-500" />, info: <Info size={17} className="text-blue-500" /> }
      const borders = { success: 'border-success-200', error: 'border-danger-200', warning: 'border-warning-200', info: 'border-blue-200' }
      toast.custom(() => (
        <motion.div initial={{ opacity: 0, y: -12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
          className={`bg-white border ${borders[variant]} shadow-float rounded-2xl px-5 py-4 flex items-start gap-3 max-w-sm`}>
          <span className="mt-0.5 flex-shrink-0">{icons[variant]}</span>
          <p className="text-sm text-surface-800 font-medium">{message}</p>
        </motion.div>
      ), { duration: variant === 'error' ? 6000 : 4000 })
    }

    if (flash.success) show(flash.success, 'success')
    if (flash.error)   show(flash.error,   'error')
    if (flash.warning) show(flash.warning, 'warning')
    if (flash.info)    show(flash.info,    'info')
  }, [flash])

  return <Toaster position="top-right" containerStyle={{ top: 80 }} />
}

// ─── Error Page ───────────────────────────────────────────────────────────────
const errorContent: Record<number, { title: string; description: string; emoji: string }> = {
  403: { title: 'Access Denied',     description: "You don't have permission to access this page.", emoji: '🔒' },
  404: { title: 'Page Not Found',    description: "The page you're looking for doesn't exist.",     emoji: '🔍' },
  419: { title: 'Session Expired',   description: 'Your session has expired. Please sign in again.', emoji: '⏱️' },
  429: { title: 'Too Many Requests', description: 'Please slow down and try again in a moment.',     emoji: '🚦' },
  500: { title: 'Server Error',      description: "Something went wrong on our end. We've been notified.", emoji: '⚙️' },
  503: { title: 'Under Maintenance', description: "We're performing maintenance. Check back soon!",  emoji: '🛠️' },
}

export default function Error({ status, message }: { status: number; message?: string }) {
  const content = errorContent[status] ?? { title: `Error ${status}`, description: message ?? 'An unexpected error occurred.', emoji: '❌' }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl mb-6">{content.emoji}
        </motion.div>
        <div className="inline-flex items-center gap-2 bg-surface-200 rounded-full px-3 py-1 text-sm font-mono text-surface-600 mb-4">
          HTTP {status}
        </div>
        <h1 className="text-3xl font-display font-bold text-surface-900 mb-3">{content.title}</h1>
        <p className="text-surface-500 mb-8">{content.description}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()}
            className="px-5 py-2.5 rounded-xl border border-surface-300 text-surface-700 text-sm font-medium hover:bg-surface-50 transition-colors">
            ← Go Back
          </button>
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
