import { Head, useForm } from '@inertiajs/react'
import { useRef, useState } from 'react'
import { 
  User, Phone, Mail, Save, Camera, 
  ShieldAlert, Settings
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge, Avatar } from '@/Components/UI'
import { cn } from '@/lib/utils'
import type { PageProps } from '@/types'

const InputField = ({ label, value, onChange, error, type = "text", placeholder = "" }: any) => (
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

const SelectField = ({ label, value, onChange, error, options }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] uppercase tracking-wider font-bold text-surface-500">{label}</label>
    <select 
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        "w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all cursor-pointer",
        error && "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500"
      )}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}
  </div>
)

interface Props extends PageProps {
  profileUser: any
}

export default function CommonProfile({ profileUser }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const { data, setData, post, processing, errors } = useForm({
    name: profileUser.name,
    email: profileUser.email,
    phone: profileUser.phone || '',
    gender: profileUser.gender || 'male',
    avatar: null as File | null,
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setData('avatar', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/profile', {
      forceFormData: true,
    })
  }

  const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-bold text-surface-900 leading-none">{title}</h3>
        <p className="text-xs text-surface-500 mt-1">{subtitle}</p>
      </div>
    </div>
  )

  const currentAvatarSrc = avatarPreview || profileUser.avatar_url

  return (
    <AppLayout title="My Bio-Data">
      <Head title="My Profile" />

      <form onSubmit={submit} className="max-w-2xl mx-auto pb-12">
        {/* Header / Avatar */}
        <div className="relative mb-8 pt-12 text-center sm:text-left flex flex-col sm:flex-row items-end gap-6 px-4">
           <div className="relative group mx-auto sm:mx-0">
             <Avatar name={profileUser.name} src={currentAvatarSrc} size="xl" className="ring-4 ring-white shadow-xl" />
             <input 
               type="file"
               ref={fileInputRef}
               className="hidden"
               accept="image/*"
               onChange={handleAvatarChange}
             />
             <button 
               type="button" 
               onClick={() => fileInputRef.current?.click()}
               className="absolute bottom-1 right-1 p-2 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-colors"
             >
               <Camera size={14} />
             </button>
           </div>
           <div className="flex-1 pb-2">
             <h1 className="text-3xl font-display font-bold text-surface-900">{profileUser.name}</h1>
             <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
               <Badge variant="brand" className="uppercase font-bold tracking-wider">{profileUser.role.replace('_', ' ')}</Badge>
               <Badge variant={profileUser.is_active ? 'success' : 'danger'}>
                 {profileUser.is_active ? 'Active' : 'Inactive'}
               </Badge>
             </div>
           </div>
           <Button type="submit" variant="brand" disabled={processing} iconLeft={<Save size={18} />}>
             {processing ? 'Saving...' : 'Save Changes'}
           </Button>
        </div>

        {errors.avatar && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-xs text-danger-700 font-medium">
            {errors.avatar}
          </div>
        )}

        <Card>
          <SectionTitle icon={User} title="Personal Details" subtitle="Manage your login and identity details" />
          <div className="space-y-4">
            <InputField label="Full Name" value={data.name} onChange={(v: string) => setData('name', v)} error={errors.name} />
            <InputField label="Email Address" value={data.email} onChange={(v: string) => setData('email', v)} error={errors.email} type="email" />
            
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Phone Number" value={data.phone} onChange={(v: string) => setData('phone', v)} error={errors.phone} />
              <SelectField 
                label="Gender" 
                value={data.gender} 
                onChange={(v: string) => setData('gender', v)} 
                error={errors.gender}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' }
                ]}
              />
            </div>
          </div>
        </Card>
      </form>
    </AppLayout>
  )
}
