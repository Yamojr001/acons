import { useState, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, GraduationCap, Search, Filter, 
  MoreVertical, UserPlus, FileDown, Eye, ChevronDown
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge, Avatar } from '@/Components/UI'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  students: {
    data: any[]
    links: any[]
    total: number
  }
  departments: any[]
  filters: {
    search?: string
    department_id?: string
    level?: string
  }
}

export default function StudentIndex({ students, departments, filters, auth }: Props) {
  const [search, setSearch] = useState(filters.search || '')
  const [dept, setDept] = useState(filters.department_id || 'all')
  const [level, setLevel] = useState(filters.level || 'all')
  const [exportOpen, setExportOpen] = useState(false)
  const isProvost = (auth?.user?.role as string) === 'provost'
  const basePath = isProvost ? '/provost/registrar/students' : '/registrar/students'
  const [isFirstRender, setIsFirstRender] = useState(true)

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false)
      return
    }

    const delayDebounceFn = setTimeout(() => {
      router.get(
        basePath, 
        { search, department_id: dept, level }, 
        { preserveState: true, replace: true }
      )
    }, 250)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.get(basePath, { search, department_id: dept, level }, { preserveState: true })
  }

  const handleDeptChange = (val: string) => {
    setDept(val)
    router.get(basePath, { search, department_id: val, level }, { preserveState: true })
  }

  const handleLevelChange = (val: string) => {
    setLevel(val)
    router.get(basePath, { search, department_id: dept, level: val }, { preserveState: true })
  }

  return (
    <AppLayout title="Student Records">
      <Head title="Student Management" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Student Directory</h1>
           <p className="text-sm text-surface-500 mt-1">Manage all registered students and their academic profiles.</p>
        </div>
        <div className="flex gap-2 relative">
            <div className="relative">
               <Button 
                 variant="outline" 
                 size="sm" 
                 iconLeft={<FileDown size={16} />}
                 iconRight={<ChevronDown size={14} />}
                 onClick={() => setExportOpen(!exportOpen)}
               >
                 Export List
               </Button>
               
               <AnimatePresence>
                 {exportOpen && (
                   <>
                     <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: 10 }}
                       className="absolute right-0 mt-2 w-48 bg-white border border-surface-150 rounded-xl shadow-lg z-20 py-1 overflow-hidden"
                     >
                       <a 
                         href={`${basePath}/export/pdf`} 
                         target="_blank" 
                         className="flex items-center px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                         onClick={() => setExportOpen(false)}
                       >
                         Download PDF Report
                       </a>
                       <a 
                         href={`${basePath}/export/csv`} 
                         className="flex items-center px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                         onClick={() => setExportOpen(false)}
                       >
                         Download CSV (Excel)
                       </a>
                       <a 
                         href={`${basePath}/export/xlsx`} 
                         className="flex items-center px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                         onClick={() => setExportOpen(false)}
                       >
                         Download Excel Sheet
                       </a>
                     </motion.div>
                   </>
                 )}
               </AnimatePresence>
            </div>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <form onSubmit={handleSearchSubmit} className="p-4 border-b border-surface-100 bg-surface-50/50 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by name, matric number, or email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
           </div>
           <div className="flex gap-2">
              <select 
                value={dept} 
                onChange={(e) => handleDeptChange(e.target.value)}
                className="px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                 <option value="all">All Departments</option>
                 {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                 ))}
              </select>
              <select 
                value={level} 
                onChange={(e) => handleLevelChange(e.target.value)}
                className="px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                 <option value="all">All Levels</option>
                 {['Basic Nursing Level 1', 'Basic Nursing Level 2', 'Basic Nursing Level 3', 'ND1', 'ND2', 'HND1', 'HND2'].map(lvl => (
                   <option key={lvl} value={lvl}>{lvl}</option>
                 ))}
              </select>
              <Button type="submit" variant="secondary" size="sm">Search</Button>
           </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Student</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Matric Number</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Department</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Level</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {students.data.map((student) => (
                <tr key={student.id} className="hover:bg-surface-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.user.name} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-surface-900 leading-none">{student.user.name}</p>
                        <p className="text-xs text-surface-500 mt-1">{student.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-surface-700 font-mono">
                    {student.matriculation_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600">
                    {student.department?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600">
                    {student.current_level}L
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={student.status === 'active' ? 'success' : 'neutral'} className="capitalize">
                      {student.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <Link href={isProvost ? `/provost/registrar/students/${student.id}` : `/registrar/students/${student.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-50 border border-surface-200 hover:bg-surface-100 hover:border-surface-300 rounded-lg text-xs font-bold text-surface-600 transition-colors">
                          <Eye size={14} /> View
                       </Link>
                       <button className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 transition-colors">
                          <MoreVertical size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-surface-400 text-sm">
                    No students matching search criteria found.
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
