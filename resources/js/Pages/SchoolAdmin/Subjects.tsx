import { Head, useForm } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader, Modal } from '@/Components/UI/Advanced'
import { Card, Button, Badge, Input } from '@/Components/UI'
import { BookOpen, Plus, Save } from 'lucide-react'
import { useState } from 'react'
import type { PageProps } from '@/types'

interface Subject { id: number; name: string; code?: string; category?: string; section?: string; exams_count?: number }
interface SubjectsProps extends PageProps {
  subjects: { data: Subject[] } | Subject[]
}

export default function Subjects({ subjects }: SubjectsProps) {
  const items: Subject[] = Array.isArray(subjects) ? subjects : (subjects as any).data ?? []

  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data, setData, post, processing, reset, errors } = useForm({
    name: '',
    code: '',
    category: '',
    section: ''
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    post('/admin/subjects', {
      onSuccess: () => {
        setIsModalOpen(false)
        reset()
      }
    })
  }

  return (
    <AppLayout title="Subjects">
      <Head title="Subjects" />
      <PageHeader
        title="Subjects"
        subtitle={`${items.length} subjects on curriculum`}
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            Add Subject
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((s) => (
          <Card key={s.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <BookOpen size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-surface-900">{s.name}</p>
                <div className="flex gap-2 items-center">
                  {s.code && <p className="text-xs text-surface-500 font-mono">{s.code}</p>}
                  {s.section && <Badge variant="neutral" className="text-[10px] px-1.5 py-0">{s.section}</Badge>}
                </div>
              </div>
            </div>
            {s.category && <p className="text-xs text-brand-600 font-medium">{s.category}</p>}
            <p className="text-xs text-surface-400">{s.exams_count ?? 0} exams scheduled</p>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-3 py-12 text-center text-surface-400">No subjects found.</div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Subject">
        <form onSubmit={submit} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Subject Name *</label>
            <Input 
              value={data.name} 
              onChange={e => setData('name', e.target.value)} 
              required
              placeholder="e.g. Mathematics"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Subject Code</label>
            <Input 
              value={data.code} 
              onChange={e => setData('code', e.target.value)} 
              placeholder="e.g. MAT101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Category</label>
            <Input 
              value={data.category} 
              onChange={e => setData('category', e.target.value)} 
              placeholder="e.g. Sciences"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Academic Section *</label>
            <select 
              className="input-select bg-white w-full"
              value={data.section}
              onChange={e => setData('section', e.target.value)}
              required
            >
              <option value="">-- Select Section --</option>
              <option value="Primary">Primary</option>
              <option value="Junior Secondary">Junior Secondary</option>
              <option value="Senior Secondary">Senior Secondary</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={processing} icon={<Save size={16} />}>
              Save Subject
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
