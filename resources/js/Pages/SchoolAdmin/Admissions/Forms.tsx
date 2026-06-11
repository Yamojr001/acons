import { useState } from 'react'
import { Head, useForm, router, usePage } from '@inertiajs/react'
import { motion } from 'framer-motion'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge, EmptyState } from '@/Components/UI'
import { Plus, Trash2, Edit2, Save, X, PlusCircle, Layout, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Field {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'date'
  required: boolean
  options?: string // comma separated for select
}

interface AdmissionForm {
  id: number
  title: string
  description: string | null
  fields: Field[]
  is_active: boolean
}

interface Props {
  forms: AdmissionForm[]
}

export default function AdmissionForms({ forms }: Props) {
  const { auth } = usePage<PageProps>().props
  const tenant = auth.tenant
  const [showModal, setShowModal] = useState(false)
  const [editingForm, setEditingForm] = useState<AdmissionForm | null>(null)

  const { data, setData, post, put, processing, reset, errors } = useForm({
    title: '',
    description: '',
    fields: [] as Field[],
    is_active: true
  })

  const openCreate = () => {
    reset()
    setEditingForm(null)
    setShowModal(true)
  }

  const openEdit = (form: AdmissionForm) => {
    setEditingForm(form)
    setData({
      title: form.title,
      description: form.description || '',
      fields: form.fields,
      is_active: form.is_active
    })
    setShowModal(true)
  }

  const addField = () => {
    const newField: Field = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'New Field',
      type: 'text',
      required: true
    }
    setData('fields', [...data.fields, newField])
  }

  const updateField = (id: string, updates: Partial<Field>) => {
    setData('fields', data.fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeField = (id: string) => {
    setData('fields', data.fields.filter(f => f.id !== id))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingForm) {
      put(route('admin.admissions.update', editingForm.id), {
        onSuccess: () => setShowModal(false)
      })
    } else {
      post(route('admin.admissions.store'), {
        onSuccess: () => setShowModal(false)
      })
    }
  }

  return (
    <AppLayout title="Admission Forms">
      <Head title="Admission Forms" />

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl font-black">Admission Forms</h1>
          <p className="text-sm text-surface-500 mt-1">Design and manage your school's application forms.</p>
        </div>
        <Button onClick={openCreate} variant="primary" icon={<Plus size={18} />}>
          Create New Form
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map(form => (
          <Card key={form.id} className="relative group overflow-hidden border-surface-200 hover:border-brand-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <Badge variant={form.is_active ? 'success' : 'neutral'}>
                {form.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <div className="flex gap-1">
                <button onClick={() => openEdit(form)} className="p-2 text-surface-400 hover:text-brand-500 transition-colors">
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => router.delete(route('admin.admissions.destroy', form.id))} 
                  className="p-2 text-surface-400 hover:text-danger-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-surface-900 mb-2 truncate">{form.title}</h3>
            <p className="text-sm text-surface-500 line-clamp-2 mb-4 h-10">{form.description || 'No description provided.'}</p>
            <div className="pt-4 border-t border-surface-100 flex items-center justify-between">
              <span className="text-xs text-surface-400 flex items-center gap-1">
                <Layout size={12} /> {form.fields?.length || 0} Fields
              </span>
              <a 
                href={tenant?.subdomain ? route('public.admission.form', { tenant: tenant.subdomain, form: form.id }) : '#'} 
                target="_blank"
                className={cn(
                  "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-300 text-surface-700 hover:bg-surface-50 transition-colors",
                  !tenant?.subdomain && "opacity-50 cursor-not-allowed"
                )}
                rel="noreferrer"
                onClick={(e) => !tenant?.subdomain && e.preventDefault()}
              >
                View Live
              </a>
            </div>
          </Card>
        ))}

        {forms.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              title="No Admission Forms"
              description="Create your first admission form to start receiving applications online."
              icon={<PlusCircle size={48} className="text-surface-300" />}
              action={<Button onClick={openCreate} variant="primary">Create Form</Button>}
            />
          </div>
        )}
      </div>

      {/* Form Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-surface-100 flex items-center justify-between bg-surface-50">
              <h2 className="text-xl font-bold text-surface-900">{editingForm ? 'Edit Admission Form' : 'Design New Form'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-surface-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-surface-700 mb-1.5">Form Title</label>
                    <input 
                      required type="text" value={data.title} onChange={e => setData('title', e.target.value)}
                      className="w-full rounded-xl border-surface-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium"
                      placeholder="e.g., 2026/2027 Primary Admissions"
                    />
                    {errors.title && <p className="text-xs text-danger-500 mt-1">{errors.title}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-surface-700 mb-1.5">Description</label>
                    <textarea 
                      value={data.description} onChange={e => setData('description', e.target.value)}
                      className="w-full rounded-xl border-surface-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 min-h-[100px]"
                      placeholder="Provide brief instructions for applicants..."
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-50 border border-surface-200">
                    <input 
                       type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)}
                       className="w-5 h-5 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                        <p className="text-sm font-bold text-surface-900">Active Form</p>
                        <p className="text-xs text-surface-500">Enable this form to be visible on your school landing page.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between mb-2">
                       <label className="text-sm font-bold text-surface-700">Form Fields</label>
                       <Button type="button" size="sm" variant="outline" onClick={addField} icon={<Plus size={14} />}>Add Field</Button>
                   </div>
                   
                   <div className="space-y-3">
                       {data.fields.map((field, idx) => (
                           <div key={field.id} className="p-5 rounded-2xl border border-surface-200 bg-white shadow-sm space-y-4 relative group hover:border-brand-300 transition-colors">
                               <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                   <div className="md:col-span-5">
                                       <label className="text-[10px] uppercase tracking-wider font-black text-surface-400 mb-1 block">Field Label</label>
                                       <input 
                                          type="text" value={field.label} placeholder="e.g. Home Address"
                                          onChange={e => updateField(field.id, { label: e.target.value })}
                                          className="w-full text-sm font-bold border-surface-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                                       />
                                   </div>
                                   <div className="md:col-span-4">
                                       <label className="text-[10px] uppercase tracking-wider font-black text-surface-400 mb-1 block">Input Type</label>
                                       <select 
                                          value={field.type} onChange={e => updateField(field.id, { type: e.target.value as any })}
                                          className="w-full text-sm rounded-xl border-surface-200 focus:ring-brand-500 focus:border-brand-500"
                                       >
                                           <option value="text">Text Input</option>
                                           <option value="number">Number</option>
                                           <option value="email">Email</option>
                                           <option value="textarea">Multi-line Text</option>
                                           <option value="select">Dropdown</option>
                                           <option value="date">Date</option>
                                       </select>
                                   </div>
                                   <div className="md:col-span-2 pb-2.5 flex items-center gap-2">
                                       <input 
                                          type="checkbox" id={`req-${field.id}`} checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })}
                                          className="w-5 h-5 rounded-lg border-surface-300 text-brand-600 focus:ring-brand-500"
                                       />
                                       <label htmlFor={`req-${field.id}`} className="text-xs font-bold text-surface-600 cursor-pointer">Required</label>
                                   </div>
                                   <div className="md:col-span-1 flex justify-end pb-1.5">
                                       <button 
                                          type="button" onClick={() => removeField(field.id)}
                                          className="p-2 text-danger-500 hover:bg-danger-50 rounded-xl transition-colors"
                                          title="Remove Field"
                                       >
                                          <Trash2 size={18} />
                                       </button>
                                   </div>
                               </div>

                               {field.type === 'select' && (
                                   <div className="pt-2 border-t border-surface-100 flex items-center gap-3">
                                       <label className="text-[10px] uppercase tracking-wider font-black text-surface-400 min-w-fit">Options (CSV):</label>
                                       <input 
                                          type="text" placeholder="Option 1, Option 2, Option 3" 
                                          value={field.options || ''} onChange={e => updateField(field.id, { options: e.target.value })}
                                          className="flex-1 text-xs rounded-lg border-surface-200 py-1.5 bg-surface-50"
                                       />
                                   </div>
                               )}
                           </div>
                       ))}
                       {data.fields.length === 0 && (
                           <div className="text-center py-10 border-2 border-dashed border-surface-200 rounded-3xl">
                               <p className="text-sm text-surface-400">No fields added yet. Add some fields like "Full Name", "Gender", etc.</p>
                           </div>
                       )}
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={processing} loading={processing} icon={<Save size={18} />}>
                  {editingForm ? 'Update Form' : 'Create Form'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AppLayout>
  )
}
