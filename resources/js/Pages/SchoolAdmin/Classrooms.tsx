import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader, Modal } from '@/Components/UI/Advanced'
import { Card, Button, Badge, Input } from '@/Components/UI'
import { Plus, Save, Users, Layers } from 'lucide-react'
import type { PageProps } from '@/types'

interface ClassRoom {
  id: number
  name: string
  full_name: string
  level: number
  section: string
  capacity: number
  academic_year: string
  teacher?: { user: { name: string } }
  students_count?: number
}

interface ClassRoomsProps extends PageProps {
  classrooms: { data: ClassRoom[] } | ClassRoom[]
  teachers: { id: number; user: { name: string } }[]
  sections: { name: string; level_limit: number }[]
}

export default function ClassRooms({ classrooms, teachers, sections }: ClassRoomsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { data, setData, post, processing, reset, errors } = useForm({
    section: '',
    level: 1,
    capacity: 35,
    academic_year: '2025/2026',
    teacher_id: ''
  })

  // Handle both paginated and plain array responses
  const items: ClassRoom[] = Array.isArray(classrooms)
    ? classrooms
    : (classrooms as any).data ?? []

  function submit(e: React.FormEvent) {
    e.preventDefault()
    post('/admin/classrooms', {
      onSuccess: () => {
        setIsModalOpen(false)
        reset()
      }
    })
  }

  const selectedSection = sections.find(s => s.name === data.section)

  return (
    <AppLayout title="Classrooms">
      <Head title="Classrooms" />
      <PageHeader
        title="Classrooms"
        subtitle={`${items.length} classes registered`}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>Add Class</Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((cls) => (
          <Card key={cls.id} className="flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-brand-50 rounded-full opacity-50" />
            <div className="flex items-center justify-between relative z-10">
              <h3 className="font-bold text-surface-900 text-lg">{cls.full_name}</h3>
              <Badge variant="brand">{cls.academic_year}</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
              <Layers size={14} className="text-surface-400" />
              <span>{cls.section}</span>
            </div>
            <div className="flex gap-4 text-sm text-surface-600 mt-2">
              <span className="flex items-center gap-1.5"><Users size={16} className="text-surface-400" /> <b>{cls.students_count ?? 0}</b></span>
              <span className="flex items-center gap-1.5 font-medium">CAP: {cls.capacity}</span>
            </div>
            {cls.teacher && (
              <div className="mt-3 pt-3 border-t border-surface-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center text-[10px] font-bold text-surface-500">
                  {cls.teacher.user.name.charAt(0)}
                </div>
                <p className="text-xs text-surface-500 font-medium truncate">
                  {cls.teacher.user.name}
                </p>
              </div>
            )}
          </Card>
        ))}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Classroom"
      >
        <form onSubmit={submit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Academic Section *</label>
              <select 
                className="input-select bg-white w-full"
                value={data.section}
                onChange={e => setData('section', e.target.value)}
                required
              >
                <option value="">-- Select Section --</option>
                {sections.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
              {errors.section && <p className="text-red-500 text-xs mt-1">{errors.section}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Level *</label>
              <select 
                className="input-select bg-white w-full"
                value={data.level}
                onChange={e => setData('level', parseInt(e.target.value) || 0)}
                required
                disabled={!data.section}
              >
                <option value="">-- Select Level --</option>
                {selectedSection && Array.from({length: selectedSection.level_limit}, (_, i) => i + 1).map(l => (
                  <option key={l} value={l}>Level {l}</option>
                ))}
              </select>
              {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Max Capacity *</label>
              <Input 
                type="number"
                value={data.capacity} 
                onChange={e => setData('capacity', parseInt(e.target.value) || 0)} 
                required
              />
              {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Academic Year *</label>
              <Input 
                value={data.academic_year} 
                onChange={e => setData('academic_year', e.target.value)} 
                required
                placeholder="e.g. 2024/2025"
              />
              {errors.academic_year && <p className="text-red-500 text-xs mt-1">{errors.academic_year}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Class Teacher (Optional)</label>
            <select 
              className="input-select bg-white w-full"
              value={data.teacher_id}
              onChange={e => setData('teacher_id', e.target.value)}
            >
              <option value="">-- No Teacher Assigned --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.user.name}</option>
              ))}
            </select>
            {errors.teacher_id && <p className="text-red-500 text-xs mt-1">{errors.teacher_id}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={processing} icon={<Save size={16} />}>
              Create Classroom
            </Button>
          </div>
        </form>
      </Modal>
    </div>
    </AppLayout>
  )
}
