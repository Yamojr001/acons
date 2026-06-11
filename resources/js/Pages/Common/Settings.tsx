import { Head, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { KeyRound, ShieldAlert, Save } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button } from '@/Components/UI'
import { cn } from '@/lib/utils'

const InputField = ({ label, value, onChange, error, type = "password", placeholder = "••••••••" }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] uppercase tracking-wider font-bold text-surface-500">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all",
        error && "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500"
      )}
    />
    {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}
  </div>
)

export default function Settings() {
  const { data, setData, post, processing, errors, reset } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/settings', {
      onSuccess: () => reset(),
    })
  }

  return (
    <AppLayout title="Security Settings">
      <Head title="Account Settings" />

      <div className="max-w-md mx-auto pt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-xl border-surface-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 leading-none">Change Password</h3>
                <p className="text-xs text-surface-500 mt-1">Ensure your account is using a long, secure password</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <InputField 
                label="Current Password" 
                value={data.current_password} 
                onChange={(v: string) => setData('current_password', v)} 
                error={errors.current_password} 
              />
              
              <InputField 
                label="New Password" 
                value={data.password} 
                onChange={(v: string) => setData('password', v)} 
                error={errors.password} 
              />

              <InputField 
                label="Confirm New Password" 
                value={data.password_confirmation} 
                onChange={(v: string) => setData('password_confirmation', v)} 
                error={errors.password_confirmation} 
              />

              <div className="pt-2">
                <Button 
                  type="submit" 
                  variant="brand" 
                  className="w-full justify-center" 
                  disabled={processing}
                  iconLeft={<Save size={18} />}
                >
                  {processing ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}
