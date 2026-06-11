import { Head, useForm, router } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader, Input } from '@/Components/UI/Advanced'
import { Card, Button } from '@/Components/UI'
import { Save, Upload, Globe, BookOpen, Plus, Trash2 } from 'lucide-react'
import type { PageProps } from '@/types'

interface SettingsProps extends PageProps {
  tenant: {
    id: number; name: string; tagline?: string; email?: string; phone?: string;
    address?: string; primary_color?: string; secondary_color?: string;
    custom_domain?: string; logo_url?: string;
    settings?: {
      teacher_mode?: 'per_class' | 'per_subject';
      current_session?: string;
      current_term?: '1st Term' | '2nd Term' | '3rd Term';
      sections?: Array<{name: string; level_limit?: number}>;
    }
  }
}

export default function Settings({ tenant }: SettingsProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: tenant.name ?? '',
    tagline: tenant.tagline ?? '',
    email: tenant.email ?? '',
    phone: tenant.phone ?? '',
    address: tenant.address ?? '',
    primary_color: tenant.primary_color ?? '#3b82f6',
    secondary_color: tenant.secondary_color ?? '#6366f1',
  })

  const academic = useForm({
    teacher_mode: tenant.settings?.teacher_mode || 'per_class',
    current_session: tenant.settings?.current_session || new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
    current_term: tenant.settings?.current_term || '1st Term',
    sections: tenant.settings?.sections || [
      { name: 'Primary', level_limit: 6 },
      { name: 'Junior Secondary', level_limit: 3 },
      { name: 'Senior Secondary', level_limit: 3 }
    ]
  })

  function submit() {
    put('/admin/settings', { preserveScroll: true })
  }

  function submitAcademic() {
    academic.put('/admin/settings/academic', { preserveScroll: true })
  }

  function addSection() {
    academic.setData('sections', [...academic.data.sections, { name: '', level_limit: 3 }])
  }

  function updateSection(index: number, key: string, value: any) {
    const newSections = [...academic.data.sections]
    newSections[index] = { ...newSections[index], [key]: value }
    academic.setData('sections', newSections)
  }

  function removeSection(index: number) {
    const newSections = academic.data.sections.filter((_, i) => i !== index)
    academic.setData('sections', newSections)
  }

  return (
    <AppLayout title="Settings">
      <Head title="Institution Settings" />
      <PageHeader title="Institution Settings" subtitle="Manage your institution's profile, branding, and academic configuration." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="font-semibold text-surface-800 mb-4">Institution Information</h3>
            <div className="space-y-4">
              <Input label="Institution Name *" value={data.name} onChange={e => setData('name', e.target.value)} error={errors.name} />
              <Input label="Tagline / Motto" value={data.tagline} onChange={e => setData('tagline', e.target.value)} placeholder="Inspiring young minds" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} />
                <Input label="Phone" value={data.phone} onChange={e => setData('phone', e.target.value)} />
              </div>
              <Input label="Address" value={data.address} onChange={e => setData('address', e.target.value)} />
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold text-surface-800 mb-4">Brand Colors</h3>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={data.primary_color}
                      onChange={e => setData('primary_color', e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer border-2 border-surface-200" />
                    <span className="text-sm font-mono text-surface-600">{data.primary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={data.secondary_color}
                      onChange={e => setData('secondary_color', e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer border-2 border-surface-200" />
                    <span className="text-sm font-mono text-surface-600">{data.secondary_color}</span>
                  </div>
                </div>
              </div>
              <Button variant="primary" icon={<Save size={16} />} loading={processing} onClick={submit}>
                Save General Settings
              </Button>
            </div>
          </Card>

          <Card className="border-t-4 border-t-brand-500">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-brand-600" size={20} />
              <h3 className="font-semibold text-surface-800">Academic Structure & Roles</h3>
            </div>
            <p className="text-sm text-surface-500 mb-6">
              Configure how teachers are assigned to classes and subjects. This affects grading permissions.
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Current Academic Session *</label>
                  <Input 
                    value={academic.data.current_session} 
                    onChange={e => academic.setData('current_session', e.target.value)} 
                    placeholder="e.g. 2024/2025"
                  />
                  {academic.errors.current_session && <p className="text-red-500 text-xs mt-1">{academic.errors.current_session}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Active Term *</label>
                  <select 
                    className="input-select bg-white w-full"
                    value={academic.data.current_term}
                    onChange={e => academic.setData('current_term', e.target.value as any)}
                  >
                    <option value="1st Term">1st Term</option>
                    <option value="2nd Term">2nd Term</option>
                    <option value="3rd Term">3rd Term</option>
                  </select>
                  {academic.errors.current_term && <p className="text-red-500 text-xs mt-1">{academic.errors.current_term}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Teacher Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-start gap-3 p-4 border border-surface-200 rounded-xl cursor-pointer hover:border-brand-500 transition-colors flex-1 bg-surface-50">
                    <input type="radio" name="teacher_mode" value="per_class" 
                      checked={academic.data.teacher_mode === 'per_class'}
                      onChange={() => academic.setData('teacher_mode', 'per_class')}
                      className="mt-1" />
                    <div>
                      <h4 className="font-medium text-surface-900">Teacher per Class (Class Master)</h4>
                      <p className="text-xs text-surface-500 mt-1">One teacher manages the entire class and enters grades for all subjects.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 border border-surface-200 rounded-xl cursor-pointer hover:border-brand-500 transition-colors flex-1 bg-surface-50">
                    <input type="radio" name="teacher_mode" value="per_subject" 
                      checked={academic.data.teacher_mode === 'per_subject'}
                      onChange={() => academic.setData('teacher_mode', 'per_subject')}
                      className="mt-1" />
                    <div>
                      <h4 className="font-medium text-surface-900">Teacher per Subject</h4>
                      <p className="text-xs text-surface-500 mt-1">Teachers are assigned specific subjects within a class. Class masters only oversee the class.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Academic Sections</label>
                <p className="text-xs text-surface-500 mb-3">Define your academic sections and how many levels they have.</p>
                
                <div className="space-y-3">
                  {academic.data.sections.map((section, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Input 
                        placeholder="Section Name (e.g. Primary)" 
                        value={section.name} 
                        onChange={e => updateSection(idx, 'name', e.target.value)} 
                        className="flex-1"
                      />
                      <Input 
                        type="number" 
                        placeholder="Max Level (e.g. 6)" 
                        value={section.level_limit?.toString()} 
                        onChange={e => updateSection(idx, 'level_limit', parseInt(e.target.value) || 1)} 
                        className="w-32"
                      />
                      <button onClick={() => removeSection(idx)} className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg shrink-0">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" size="sm" onClick={addSection} className="mt-3" icon={<Plus size={14} />}>
                  Add Section
                </Button>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-surface-100">
              <Button variant="primary" icon={<Save size={16} />} loading={academic.processing} onClick={submitAcademic}>
                Save Academic Settings
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <h3 className="font-semibold text-surface-800 mb-4">Institution Logo</h3>
            <div className="w-full h-28 rounded-2xl bg-surface-100 flex items-center justify-center mb-4 overflow-hidden">
              {tenant.logo_url
                ? <img src={tenant.logo_url} className="h-full object-contain" />
                : <span className="text-surface-400 text-4xl font-bold">{tenant.name[0]}</span>
              }
            </div>
            <label className="w-full block">
              <input type="file" accept="image/*" className="hidden"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    const form = new FormData()
                    form.append('logo', e.target.files[0])
                    router.post('/admin/settings/logo', form, { preserveScroll: true })
                  }
                }} />
              <Button variant="outline" className="w-full" icon={<Upload size={14} />} as="span">
                Upload Logo
              </Button>
            </label>
          </Card>

          <Card>
            <h3 className="font-semibold text-surface-800 mb-2">Custom Domain</h3>
            <p className="text-xs text-surface-500 mb-3">Connect your own domain to this institution portal.</p>
            <Input
              label="Domain"
              placeholder="school.yourdomain.com"
              defaultValue={tenant.custom_domain ?? ''}
            />
            <Button variant="outline" className="w-full mt-3" icon={<Globe size={14} />}>
              Set Domain
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
