// ─── Forgot Password ─────────────────────────────────────────────────────────
import { FormEvent, useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import GuestLayout from '@/Layouts/GuestLayout'
import { Button, Input, Alert, Card } from '@/Components/UI'

export function ForgotPassword({ status }: { status?: string }) {
  const { data, setData, post, processing, errors } = useForm({ email: '' })

  return (
    <GuestLayout>
      <Head title="Forgot Password" />
      <Card className="p-8 shadow-float">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-display font-bold text-surface-900">Reset Password</h1>
          <p className="text-surface-500 text-sm mt-1">Enter your email address and we'll send you a reset link.</p>
        </motion.div>

        {status && (
          <Alert variant="success" className="mb-5">
            <div className="flex items-center gap-2"><CheckCircle2 size={15} />{status}</div>
          </Alert>
        )}

        <form onSubmit={e => { e.preventDefault(); post('/forgot-password') }} className="space-y-4">
          <Input label="Email Address" type="email" value={data.email} onChange={e => setData('email', e.target.value)}
            error={errors.email} leftIcon={<Mail size={15} />} placeholder="you@institution.edu.ng" autoFocus />

          <Button type="submit" variant="primary" size="lg" loading={processing} className="w-full" icon={<Send size={15} />}>
            Send Reset Link
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm text-surface-500 hover:text-surface-700 flex items-center justify-center gap-1.5">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </Card>
    </GuestLayout>
  )
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export function ResetPassword({ token, email }: { token: string; email: string }) {
  const [showPass, setShowPass] = useState(false)
  const { data, setData, post, processing, errors } = useForm({
    token,
    email,
    password: '',
    password_confirmation: '',
  })

  return (
    <GuestLayout>
      <Head title="Set New Password" />
      <Card className="p-8 shadow-float">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-display font-bold text-surface-900">Set New Password</h1>
          <p className="text-surface-500 text-sm mt-1">Choose a strong password for your account.</p>
        </motion.div>

        <form onSubmit={e => { e.preventDefault(); post('/reset-password') }} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="input bg-surface-50 text-surface-500 flex items-center gap-2">
              <Mail size={15} className="text-surface-400" />{email}
            </div>
          </div>

          <Input label="New Password" type={showPass ? 'text' : 'password'} value={data.password}
            onChange={e => setData('password', e.target.value)} error={errors.password}
            placeholder="Minimum 8 characters"
            rightIcon={<button type="button" onClick={() => setShowPass(!showPass)} className="text-surface-400 hover:text-surface-600 transition-colors text-xs">{showPass ? 'Hide' : 'Show'}</button>} />

          <Input label="Confirm Password" type="password" value={data.password_confirmation}
            onChange={e => setData('password_confirmation', e.target.value)}
            error={errors.password_confirmation} placeholder="Repeat your password" />

          <Button type="submit" variant="primary" size="lg" loading={processing} className="w-full" icon={<CheckCircle2 size={15} />}>
            Reset Password
          </Button>
        </form>
      </Card>
    </GuestLayout>
  )
}

export default ForgotPassword
