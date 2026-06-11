import { useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Button, Badge } from '@/Components/UI'
import { ArrowLeft, Save, GraduationCap, RefreshCw, ChevronRight } from 'lucide-react'
import type { PageProps, Student, ClassRoom } from '@/types'

interface PromotionPageProps extends PageProps {
  classroom: ClassRoom & { full_name: string; level: number; section: string }
  students: Student[]
  allClasses: (ClassRoom & { full_name: string; level: number; section: string })[]
}

export default function ClassPromotion({ classroom, students, allClasses }: PromotionPageProps) {
  const { data, setData, post, processing, errors } = useForm({
    promotions: students.map(s => ({
      student_id: s.id,
      next_class_id: '',
      status: 'promote' as 'promote' | 'repeat' | 'graduate'
    }))
  })

  function handleStatusChange(index: number, status: 'promote' | 'repeat' | 'graduate') {
    const newPromos = [...data.promotions]
    newPromos[index].status = status
    
    // Auto-suggest next class if promoting
    if (status === 'promote') {
       const nextLevel = classroom.level + 1
       const nextClass = allClasses.find(c => c.section === classroom.section && c.level === nextLevel)
       if (nextClass) {
          newPromos[index].next_class_id = nextClass.id.toString()
       }
    } else if (status === 'repeat') {
       newPromos[index].next_class_id = classroom.id.toString()
    } else {
       newPromos[index].next_class_id = ''
    }
    
    setData('promotions', newPromos)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/admin/promotion/process')
  }

  return (
    <AppLayout title={`Promote - ${classroom.full_name}`}>
      <Head title={`Promotion - ${classroom.full_name}`} />
      <PageHeader
        title={`Class Promotion: ${classroom.full_name}`}
        subtitle="Process student promotions for the next academic session."
        actions={
          <Button variant="primary" onClick={handleSubmit} loading={processing} icon={<Save size={16} />}>
            Save Promotions
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Current Class</th>
              <th className="px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-wider">Next Destination</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {students.map((student, idx) => (
              <tr key={student.id} className="hover:bg-surface-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-600">
                      {student.user?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{student.user?.name}</p>
                      <p className="text-xs text-surface-500">{student.admission_number}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="neutral">{classroom.full_name}</Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => handleStatusChange(idx, 'promote')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${data.promotions[idx].status === 'promote' ? 'bg-success-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
                    >
                      Promote
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleStatusChange(idx, 'repeat')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${data.promotions[idx].status === 'repeat' ? 'bg-warning-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
                    >
                      Repeat
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleStatusChange(idx, 'graduate')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                        ${data.promotions[idx].status === 'graduate' ? 'bg-indigo-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
                    >
                      Graduate
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {data.promotions[idx].status === 'graduate' ? (
                     <Badge variant="neutral" className="bg-indigo-50 text-indigo-700 border-indigo-100">Alumni Status</Badge>
                  ) : (
                    <select 
                      className="input-select bg-white w-full max-w-[200px] text-sm"
                      value={data.promotions[idx].next_class_id}
                      onChange={e => {
                        const newPromos = [...data.promotions]
                        newPromos[idx].next_class_id = e.target.value
                        setData('promotions', newPromos)
                      }}
                    >
                      <option value="">-- Select Class --</option>
                      {allClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {students.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-surface-400 font-medium italic">No students found in this class.</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
