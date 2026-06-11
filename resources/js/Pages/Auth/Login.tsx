import { FormEvent, useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, Clock } from 'lucide-react'
import GuestLayout from '@/Layouts/GuestLayout'
import { Button, Alert, Card } from '@/Components/UI'
import { Input } from '@/Components/UI/Advanced'

interface LoginProps { status?: string; canResetPassword: boolean }

export default function Login({ status, canResetPassword }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({ email: '', password: '', remember: false })
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (errors.email) {
      const match = errors.email.match(/Try again in (\d+) seconds/)
      if (match) setCountdown(parseInt(match[1], 10))
    }
  }, [errors.email])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && errors.email && errors.email.includes('Try again in')) {
      clearErrors('email') // Auto-clear rate limit error when countdown finishes
    }
  }, [countdown, errors.email])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (countdown > 0) return
    post('/login', { onFinish: () => reset('password') })
  }

  return (
    <GuestLayout>
      <Head title="Sign In" />
      <Card className="p-8 shadow-float">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Secure Portal Access</span>
          </div>
          <h1 className="text-2xl font-display font-black text-surface-900 tracking-tight">ACONS Academic Portal</h1>
          <p className="text-surface-500 text-xs leading-relaxed mt-2 font-medium">
            Sign in using your official institutional email and secure credentials to access your personalized course registries, marks sheets, and financial statement reports.
          </p>
        </motion.div>

        {status && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
            <Alert variant="success">{status}</Alert>
          </motion.div>
        )}

        <AnimatePresence>
          {countdown > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
              <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex gap-4 items-center">
                <div className="bg-danger-100 p-2.5 rounded-full text-danger-600 animate-pulse">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-danger-800 font-semibold text-sm">Account Temporarily Locked</h3>
                  <p className="text-danger-700 text-sm mt-0.5">
                    Too many failed attempts. Please wait <strong className="font-mono text-base ml-1">{countdown}</strong> seconds.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Input label="Email address" type="email" id="email" value={data.email}
              onChange={e => setData('email', e.target.value)}
              placeholder="you@school.com" autoComplete="email" autoFocus
              error={countdown === 0 ? errors.email : undefined} leftIcon={<Mail size={15} />} required disabled={countdown > 0} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Input label="Password" type={showPassword ? 'text' : 'password'} id="password"
              value={data.password} onChange={e => setData('password', e.target.value)}
              placeholder="••••••••" autoComplete="current-password"
              error={errors.password} leftIcon={<Lock size={15} />}
              disabled={countdown > 0}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} disabled={countdown > 0}
                  className="p-0.5 rounded text-surface-400 hover:text-surface-600 transition-colors disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              } required />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={data.remember} onChange={e => setData('remember', e.target.checked)}
                className="rounded border-surface-300 text-brand-500 focus:ring-brand-400/20 focus:ring-2" />
              <span className="text-sm text-surface-600">Remember me</span>
            </label>
            {canResetPassword && (
              <Link href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                Forgot password?
              </Link>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Button type="submit" variant="primary" size="lg" loading={processing} disabled={countdown > 0} className="w-full"
              iconRight={!processing && countdown === 0 ? <ArrowRight size={16} /> : undefined}>
              {countdown > 0 ? `Locked (${countdown}s)` : 'Sign in'}
            </Button>
          </motion.div>
        </form>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-6 pt-5 border-t border-surface-100 flex items-center justify-center gap-2 text-xs text-surface-400">
          <ShieldCheck size={12} />
          <span>256-bit SSL · Rate-limited · CSRF protected</span>
        </motion.div>
      </Card>
    </GuestLayout>
  )
}
