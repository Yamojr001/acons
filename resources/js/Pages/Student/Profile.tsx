import { Head, useForm } from '@inertiajs/react'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Phone, MapPin, Heart, Shield, 
  Users, Mail, Award, Save, Camera,
  FileText, Briefcase, Globe
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
  student: any
}

export default function StudentProfile({ student }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const { data, setData, post, processing, errors } = useForm({
    name: student.user.name,
    email: student.user.email,
    phone_number: student.phone_number || '',
    gender: student.gender || 'male',
    address: student.address || '',
    state_of_origin: student.state_of_origin || '',
    lga: student.lga || '',
    blood_group: student.blood_group || '',
    genotype: student.genotype || '',
    allergies: student.allergies || '',
    next_of_kin_name: student.next_of_kin_name || '',
    next_of_kin_relationship: student.next_of_kin_relationship || '',
    next_of_kin_phone: student.next_of_kin_phone || '',
    next_of_kin_email: student.next_of_kin_email || '',
    next_of_kin_address: student.next_of_kin_address || '',
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
  const currentAvatarSrc = avatarPreview || student.user.avatar_url

  return (
    <AppLayout title="My Bio-Data">
      <Head title="Student Profile" />

      <form onSubmit={submit} className="max-w-4xl mx-auto pb-12">
        {/* Header / Avatar */}
        <div className="relative mb-8 pt-12 text-center sm:text-left flex flex-col sm:flex-row items-end gap-6 px-4">
           <div className="relative group mx-auto sm:mx-0">
             <Avatar name={student.user.name} src={currentAvatarSrc} size="xl" className="ring-4 ring-white shadow-xl" />
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
             <h1 className="text-3xl font-display font-bold text-surface-900">{student.user.name}</h1>
             <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
               <Badge variant="brand">{student.matriculation_number}</Badge>
               <Badge variant="neutral">{student.department?.name}</Badge>
               <Badge variant="success">Level {student.current_level}</Badge>
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
            <SectionTitle icon={User} title="Personal Record" subtitle="Legal identity and location details" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-surface-500">Nationality</label>
                  <div className="px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-xl text-sm text-surface-600 font-bold">
                    {student.nationality}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-surface-500">Date of Birth</label>
                  <div className="px-4 py-2.5 bg-surface-100 border border-surface-200 rounded-xl text-sm text-surface-600 font-bold">
                    {student.date_of_birth}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            {/* Medical Info */}
            <Card className="border-danger-100 bg-danger-50/20">
              <SectionTitle icon={Heart} title="Medical Information" subtitle="Vital health records for emergencies" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputField label="Blood Group" value={data.blood_group} onChange={(v: string) => setData('blood_group', v)} error={errors.blood_group} placeholder="e.g. O+" />
                <InputField label="Genotype" value={data.genotype} onChange={(v: string) => setData('genotype', v)} error={errors.genotype} placeholder="e.g. AA" />
              </div>
              <InputField label="Allergies / Chronic Conditions" value={data.allergies} onChange={(v: string) => setData('allergies', v)} error={errors.allergies} />
            </Card>

            {/* Next of Kin */}
            <Card>
              <SectionTitle icon={Users} title="Parental / Next of Kin" subtitle="Emergency contact information" />
              <div className="space-y-4">
                <InputField label="Full Name" value={data.next_of_kin_name} onChange={(v: string) => setData('next_of_kin_name', v)} error={errors.next_of_kin_name} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Relationship" value={data.next_of_kin_relationship} onChange={(v: string) => setData('next_of_kin_relationship', v)} error={errors.next_of_kin_relationship} />
                  <InputField label="Phone Number" value={data.next_of_kin_phone} onChange={(v: string) => setData('next_of_kin_phone', v)} error={errors.next_of_kin_phone} />
                </div>
                <InputField label="Email Address" value={data.next_of_kin_email} onChange={(v: string) => setData('next_of_kin_email', v)} error={errors.next_of_kin_email} type="email" />
                <InputField label="Home Address" value={data.next_of_kin_address} onChange={(v: string) => setData('next_of_kin_address', v)} error={errors.next_of_kin_address} />
              </div>
            </Card>
          </div>

          {/* Academic Profile (Read Only) */}
          <Card className="md:col-span-2 border-brand-100 bg-brand-50/10">
             <SectionTitle icon={Award} title="Academic Life" subtitle="Official institutional records" />
             <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Faculty</p>
                  <p className="text-sm font-bold text-surface-900">{student.department?.faculty?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Department</p>
                  <p className="text-sm font-bold text-surface-900">{student.department?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Program of Study</p>
                  <p className="text-sm font-bold text-surface-900">{student.program?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-surface-400 uppercase font-bold tracking-tight">Enrollment Status</p>
                  <Badge variant="success" className="mt-1">{student.status}</Badge>
                </div>
             </div>
          </Card>
        </div>
      </form>
    </AppLayout>
  )
}
