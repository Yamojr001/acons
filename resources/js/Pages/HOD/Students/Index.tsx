import { useState } from 'react'
import { Head } from '@inertiajs/react'
import { 
  GraduationCap, Mail, Phone, Search, Filter, BookOpen, User
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Avatar } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  students: {
    data: any[]
    links: any[]
    total: number
  }
  department_name: string
}

export default function HODStudentIndex({ students, department_name }: Props) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  const filteredStudents = students.data.filter(student => {
    const matchesSearch = 
      student.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      student.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      student.matriculation_number?.toLowerCase().includes(search.toLowerCase()) ||
      student.jamb_registration_number?.toLowerCase().includes(search.toLowerCase())

    const matchesLevel = 
      levelFilter === 'all' || 
      student.current_level?.toString() === levelFilter

    return matchesSearch && matchesLevel
  })

  return (
    <AppLayout title="Department Student Directory">
      <Head title="Department Students" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900 font-bold">Department Students</h1>
           <p className="text-sm text-surface-500 mt-1">Directory of students enrolled in the {department_name} department.</p>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Search students by name, email, matric or JAMB number..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
           </div>
           <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-surface-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Filter size={14} /> Level:
              </span>
              <select 
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              >
                <option value="all">All Levels</option>
                {['Basic Nursing Level 1', 'Basic Nursing Level 2', 'Basic Nursing Level 3', 'ND1', 'ND2', 'HND1', 'HND2'].map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Student Info</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Matric / JAMB No.</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Level</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Program</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredStudents.map((student) => {
                return (
                  <tr key={student.id} className="hover:bg-surface-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.user?.name} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-surface-900 leading-none">{student.user?.name}</p>
                          <p className="text-xs text-surface-400 mt-1.5 flex items-center gap-2">
                             <span className="flex items-center gap-1"><Mail size={10} /> {student.user?.email}</span>
                             {student.phone_number && (
                               <span className="flex items-center gap-1"><Phone size={10} /> {student.phone_number}</span>
                             )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-surface-700 font-mono">
                      <div>{student.matriculation_number || 'N/A'}</div>
                      <div className="text-[10px] text-surface-400 font-normal">JAMB: {student.jamb_registration_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral" className="font-mono">
                        {student.current_level} Level
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600">
                      {student.program?.name || 'Nursing Science'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={student.status === 'active' ? 'success' : 'warning'} className="capitalize">
                        {student.status || 'active'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
              {filteredStudents.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-surface-400 italic text-sm">
                      No matching students found in your department register.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  )
}
