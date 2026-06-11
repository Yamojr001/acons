import { Head, useForm, Link } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Button, Input } from '@/Components/UI'
import { BookOpen, Save, ArrowLeft, CheckCircle2 } from 'lucide-react'
import type { PageProps, ClassRoom, Subject } from '@/types'

interface SubjectTeacher {
  id: number
  subject_id: number
  teacher_id: number
  teacher?: { user: { name: string } }
}

interface ClassRoomData extends ClassRoom {
  subjects?: Subject[]
  subject_teachers?: SubjectTeacher[]
}

interface Teacher {
  id: number
  user: { name: string }
}

interface Props extends PageProps {
  classroom: ClassRoomData
  subjects: Subject[]
  teachers: Teacher[]
  teacherMode: 'per_class' | 'per_subject'
}

export default function ClassSubjects({ classroom, subjects, teachers, teacherMode }: Props) {
  const initialSubjects = classroom.subjects?.map(s => s.id) || []
  
  // Transform subject_teachers array into an object mapping subject_id -> teacher_id
  const initialAssignments: Record<number, number> = {}
  classroom.subject_teachers?.forEach(st => {
    initialAssignments[st.subject_id] = st.teacher_id
  })

  const { data, setData, post, processing } = useForm({
    subjects: initialSubjects,
    assignments: initialAssignments
  })

  function toggleSubject(subjectId: number) {
    let newSubjects = [...data.subjects]
    if (newSubjects.includes(subjectId)) {
      newSubjects = newSubjects.filter(id => id !== subjectId)
    } else {
      newSubjects.push(subjectId)
    }
    setData('subjects', newSubjects)
  }

  function assignTeacher(subjectId: number, teacherId: string) {
    setData('assignments', {
      ...data.assignments,
      [subjectId]: parseInt(teacherId) || 0
    })
  }

  function submit() {
    post(`/teacher/my-classes/${classroom.id}/subjects`, {
      preserveScroll: true
    })
  }

  return (
    <AppLayout title={`Manage Subjects - ${classroom.name}`}>
      <Head title={`Manage Subjects - ${classroom.name}`} />

      <div className="mb-6 flex items-center justify-between">
         <div>
           <Link href="/lecturer/my-courses" className="text-surface-500 hover:text-surface-800 text-sm flex items-center gap-1 mb-2 transition-colors">
             <ArrowLeft size={16} /> Back to My Classes
           </Link>
           <h1 className="page-title flex items-center gap-2">
             <BookOpen className="text-brand-600" size={24} /> {classroom.name} Subjects
           </h1>
           <p className="text-sm text-surface-500 mt-1">
             Select the active subjects for this class{teacherMode === 'per_subject' ? ' and assign subject teachers.' : '.'}
           </p>
         </div>
         <div>
           <Button variant="primary" icon={<Save size={16} />} loading={processing} onClick={submit}>
             Save Changes
           </Button>
         </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-surface-900 w-16 text-center">Active</th>
                <th className="px-6 py-4 font-semibold text-surface-900">Subject Name</th>
                <th className="px-6 py-4 font-semibold text-surface-900">Code/Category</th>
                {teacherMode === 'per_subject' && (
                  <th className="px-6 py-4 font-semibold text-surface-900">Assigned Teacher</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {subjects.map((subject) => {
                const isActive = data.subjects.includes(subject.id)
                return (
                  <tr key={subject.id} className={`hover:bg-surface-50/50 transition-colors ${isActive ? 'bg-brand-50/10' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      <div 
                        className={`w-6 h-6 rounded cursor-pointer mx-auto flex items-center justify-center transition-colors border-2 ${isActive ? 'bg-brand-500 border-brand-500 text-white' : 'border-surface-300 bg-white hover:border-brand-400'}`}
                        onClick={() => toggleSubject(subject.id)}
                      >
                        {isActive && <CheckCircle2 size={16} />}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-surface-900">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 text-surface-500">
                      {subject.code || '-'} {subject.category ? `• ${subject.category}` : ''}
                    </td>
                    {teacherMode === 'per_subject' && (
                      <td className="px-6 py-4">
                        {isActive ? (
                          <select 
                            className="input-select bg-white w-full max-w-[250px] py-1.5 text-sm"
                            value={data.assignments[subject.id] || ''}
                            onChange={(e) => assignTeacher(subject.id, e.target.value)}
                          >
                            <option value="">-- Select Teacher --</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.user?.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-surface-400 text-sm italic">Subject must be active</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {subjects.length === 0 && (
            <div className="py-12 text-center text-surface-500">
               No subjects configured in the system.
            </div>
          )}
        </div>
      </Card>
    </AppLayout>
  )
}
