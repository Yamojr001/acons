import { Head, useForm } from '@inertiajs/react'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Phone, MapPin, Heart, Shield, 
  Users, Mail, Award, Save, Camera,
  Briefcase, Globe
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
  lecturer: any
}

export default function LecturerProfile({ lecturer }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const { data, setData, post, processing, errors } = useForm({
    name: lecturer.user.name,
    email: lecturer.user.email,
    phone_number: lecturer.phone_number || '',
    gender: lecturer.gender || 'male',
    address: lecturer.address || '',
    state_of_origin: lecturer.state_of_origin || '',
    lga: lecturer.lga || '',
    blood_group: lecturer.blood_group || '',
    genotype: lecturer.genotype || '',
    allergies: lecturer.allergies || '',
    next_of_kin_name: lecturer.next_of_kin_name || '',
    next_of_kin_relationship: lecturer.next_of_kin_relationship || '',
    next_of_kin_phone: lecturer.next_of_kin_phone || '',
    next_of_kin_email: lecturer.next_of_kin_email || '',
    next_of_kin_address: lecturer.next_of_kin_address || '',
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

  const currentAvatarSrc = avatarPreview || lecturer.user.avatar_url

  return (
    <AppLayout title="My Bio-Data">
      <Head title="Staff Profile" />

      <form onSubmit={submit} className="max-w-4xl mx-auto pb-12">
        <div className="relative mb-8 pt-12 text-center sm:text-left flex flex-col sm:flex-row items-end gap-6 px-4">
           <div className="relative group mx-auto sm:mx-0">
             <Avatar name={lecturer.user.name} src={currentAvatarSrc} size="xl" className="ring-4 ring-white shadow-xl" />
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
             <h1 className="text-3xl font-display font-bold text-surface-900">{lecturer.user.name}</h1>
             <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
               <Badge variant="brand">{lecturer.employee_id}</Badge>
               <Badge variant="neutral">{lecturer.department?.name}</Badge>
               <Badge variant="success" className="capitalize">{lecturer.status}</Badge>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Record */}
          <Card>
            <SectionTitle icon={User} title="Personal Record" subtitle="Staff legal identity and location" />
            <div className="space-y-4">
              <InputField label="Full Name" value={data.name} onChange={(v: string) => setData('name', v)} error={errors.name} />
              <InputField label="Email Address" value={data.email} onChange={(v: string) => setData('email', v)} error={errors.email} type="email" />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Phone Number" value={data.phone_number} onChange={(v: string) => setData('phone_number', v)} error={errors.phone_number} />
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
              
              <InputField label="Residential Address" value={data.address} onChange={(v: string) => setData('address', v)} error={errors.address} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="State of Origin" value={data.state_of_origin} onChange={(v: string) => setData('state_of_origin', v)} error={errors.state_of_origin} />
                <InputField label="L.G.A" value={data.lga} onChange={(v: string) => setData('lga', v)} error={errors.lga} />
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            {/* Medical Info */}
            <Card className="border-danger-100 bg-danger-50/20">
              <SectionTitle icon={Heart} title="Medical Information" subtitle="Vital health records for staff" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Blood Group" value={data.blood_group} onChange={(v: string) => setData('blood_group', v)} error={errors.blood_group} placeholder="e.g. O+" />
                <InputField label="Genotype" value={data.genotype} onChange={(v: string) => setData('genotype', v)} error={errors.genotype} placeholder="e.g. AA" />
              </div>
              <InputField label="Allergies / Chronic Conditions" value={data.allergies} onChange={(v: string) => setData('allergies', v)} error={errors.allergies} />
            </Card>

            {/* Next of Kin */}
            <Card>
              <SectionTitle icon={Users} title="Emergency Contact" subtitle="Next of kin information" />
              <div className="space-y-4">
                <InputField label="Full Name" value={data.next_of_kin_name} onChange={(v: string) => setData('next_of_kin_name', v)} error={errors.next_of_kin_name} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Relationship" value={data.next_of_kin_relationship} onChange={(v: string) => setData('next_of_kin_relationship', v)} error={errors.next_of_kin_relationship} />
                  <InputField label="Phone Number" value={data.next_of_kin_phone} onChange={(v: string) => setData('next_of_kin_phone', v)} error={errors.next_of_kin_phone} />
                </div>
                <InputField label="Email Address" value={data.next_of_kin_email} onChange={(v: string) => setData('next_of_kin_email', v)} error={errors.next_of_kin_email} type="email" />
              </div>
            </Card>
          </div>

          {/* Professional Profile (Read Only) */}
          <Card className="md:col-span-2 border-brand-100 bg-brand-50/10">
             <SectionTitle icon={Briefcase} title="Professional Life" subtitle="Official institutional employment records" />
             <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Designation</p>
                  <p className="text-sm font-bold text-surface-900">Lecturer</p>
                </div>
                <div>
                  <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Department</p>
                  <p className="text-sm font-bold text-surface-900">{lecturer.department?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Qualification</p>
                  <p className="text-sm font-bold text-surface-900">{lecturer.qualification}</p>
                </div>
                <div>
                  <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Date of Hire</p>
                  <p className="text-sm font-bold text-surface-900">{lecturer.hire_date}</p>
                </div>
             </div>
          </Card>
        </div>
      </form>
    </AppLayout>
  )
}
