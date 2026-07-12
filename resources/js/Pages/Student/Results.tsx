import { useState } from 'react'
import { Head } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { 
  Trophy, BookOpen, Printer, ChevronRight, 
  Search, Filter, Award, Star, GraduationCap
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState, Avatar } from '@/Components/UI'
import type { PageProps } from '@/types'

interface ResultGroup {
  session_name: string
  semester_load: number
  grades: Array<{
    course_code: string
    course_name: string
    units: number
    score: number
    grade: string
    points: number
  }>
  semester_gpa: number
}

interface Props extends PageProps {
  groupedResults: Record<string, ResultGroup>
  studentDetails: {
    name: string
    matric_number: string
    level: string
    department: string
    avatar_url: string
    cgpa: number
    total_load: number
    academic_status: string
    reseat_courses: string[]
  }
}

export default function StudentResults({ groupedResults, studentDetails }: Props) {
  const groups = Object.values(groupedResults)
  
  // By default select the most recent session/semester
  const [selectedSession, setSelectedSession] = useState<string>(groups[0]?.session_name || '')

  const currentGroup = groups.find(g => g.session_name === selectedSession)

  const handlePrint = () => {
    window.print()
  }

  return (
    <AppLayout title="Academic Transcript">
      <Head title="Academic Results" />

      {/* Hide controls when printing */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Academic Transcript</h1>
          <p className="text-sm text-surface-500 mt-1">View your official semester-by-semester performance history.</p>
        </div>
        <div className="flex items-center gap-3">
          {groups.length > 0 && (
            <select 
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-500/20 outline-none"
            >
              {groups.map(g => (
                <option key={g.session_name} value={g.session_name}>
                  {g.session_name}
                </option>
              ))}
            </select>
          )}
          <Button variant="brand" onClick={handlePrint} iconLeft={<Printer size={16} />}>
            Print Result
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="py-20 text-center print:hidden">
          <EmptyState
            title="No Results Yet"
            description="Your academic records will appear here as soon as they are approved by the Senate."
            icon={<Award size={48} className="text-surface-200" />}
          />
        </Card>
      ) : (
        /* Print Container */
        <div className="bg-white rounded-2xl shadow-sm border border-surface-150 p-8 md:p-12 print:p-0 print:border-none print:shadow-none w-full max-w-5xl mx-auto mb-10">
          
          {/* Print Header */}
          <div className="flex items-start justify-between border-b-2 border-surface-200 pb-8 mb-8 print:pb-3 print:mb-3">
            <div className="flex items-center gap-5 print:gap-3">
              <Avatar 
                src={studentDetails.avatar_url} 
                name={studentDetails.name} 
                className="w-24 h-24 print:w-16 print:h-16 rounded-2xl border-4 border-surface-50 print:border-gray-200 print:rounded-none object-cover" 
              />
              <div>
                <h2 className="text-2xl print:text-lg font-display font-bold text-surface-900 uppercase tracking-wide">
                  {studentDetails.name}
                </h2>
                <div className="grid grid-cols-2 gap-x-8 print:gap-x-4 gap-y-2 print:gap-y-0.5 mt-3 print:mt-1 text-sm print:text-[10px] font-medium text-surface-700">
                  <p><span className="text-surface-400 font-bold uppercase tracking-wider text-[10px] print:text-[8px] block">Reg Number</span> {studentDetails.matric_number || 'N/A'}</p>
                  <p><span className="text-surface-400 font-bold uppercase tracking-wider text-[10px] print:text-[8px] block">Department</span> {studentDetails.department}</p>
                  <p><span className="text-surface-400 font-bold uppercase tracking-wider text-[10px] print:text-[8px] block">Current Level</span> {studentDetails.level || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="inline-block bg-brand-50 print:bg-white print:border print:border-gray-300 text-brand-700 print:text-black px-6 py-4 print:px-3 print:py-1 rounded-2xl print:rounded-md text-center">
                <p className="text-[10px] print:text-[8px] font-bold uppercase tracking-widest opacity-80 mb-1 print:mb-0">Cumulative GPA</p>
                <p className="text-4xl print:text-2xl font-display font-bold leading-none">{studentDetails.cgpa.toFixed(2)}</p>
              </div>
              <p className="text-xs print:text-[10px] font-bold text-surface-500 mt-3 print:mt-1">Total Units: <span className="text-surface-900 print:text-black">{studentDetails.total_load}</span></p>
            </div>
          </div>

          {currentGroup && (
            <motion.div 
              key={currentGroup.session_name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-4 print:mb-2 px-2 print:px-0">
                <div>
                  <h3 className="font-bold text-surface-900 text-xl print:text-sm uppercase">{currentGroup.session_name}</h3>
                  <p className="text-sm print:text-[10px] font-semibold text-surface-500 mt-1 print:mt-0">
                    Semester Units Registered: <span className="text-surface-900 print:text-black">{currentGroup.semester_load}</span>
                  </p>
                </div>
                <div className="text-right border-l-2 pl-6 py-1 print:pl-3 print:py-0 print:border-gray-300">
                  <p className="text-[10px] print:text-[8px] text-surface-500 uppercase font-bold mb-0.5">Semester GPA</p>
                  <p className="text-2xl print:text-lg font-display font-bold text-brand-600 print:text-black">{currentGroup.semester_gpa.toFixed(2)}</p>
                </div>
              </div>

              <div className="overflow-hidden border border-surface-200 print:border-gray-300 rounded-xl print:rounded-none">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-50 print:bg-gray-100 text-xs print:text-[9px] uppercase tracking-wider text-surface-600 print:text-black font-bold">
                    <tr>
                      <th className="px-6 py-4 print:px-2 print:py-1.5 border-b print:border-gray-300">Course Code</th>
                      <th className="px-6 py-4 print:px-2 print:py-1.5 border-b print:border-gray-300">Course Title</th>
                      <th className="px-6 py-4 print:px-2 print:py-1.5 border-b print:border-gray-300 text-center">Units</th>
                      <th className="px-6 py-4 print:px-2 print:py-1.5 border-b print:border-gray-300 text-center">Score</th>
                      <th className="px-6 py-4 print:px-2 print:py-1.5 border-b print:border-gray-300 text-center">Grade</th>
                      <th className="px-6 py-4 print:px-2 print:py-1.5 border-b print:border-gray-300 text-center">GP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 print:divide-gray-200 bg-white">
                    {currentGroup.grades.map((g, i) => (
                      <tr key={i} className="hover:bg-surface-50/50 transition-colors print:hover:bg-white">
                        <td className="px-6 py-4 print:px-2 print:py-1 border-b print:border-gray-200">
                          <span className="text-sm print:text-[10px] font-mono font-bold text-surface-900 print:text-black">{g.course_code}</span>
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-1 border-b print:border-gray-200 text-sm print:text-[10px] text-surface-700 print:text-black font-medium">{g.course_name}</td>
                        <td className="px-6 py-4 print:px-2 print:py-1 border-b print:border-gray-200 text-center text-sm print:text-[10px] font-bold text-surface-600 print:text-black">{g.units}</td>
                        <td className="px-6 py-4 print:px-2 print:py-1 border-b print:border-gray-200 text-center text-sm print:text-[10px] font-mono font-bold text-surface-900 print:text-black">{g.score}</td>
                        <td className="px-6 py-4 print:px-2 print:py-1 border-b print:border-gray-200 text-center">
                          <span className="font-bold text-sm print:text-[10px] text-surface-900 print:text-black">
                            {g.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 print:px-2 print:py-1 border-b print:border-gray-200 text-center text-sm print:text-[10px] font-bold text-surface-900 print:text-black">{g.points.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Semester-specific Resit Courses */}
              {currentGroup.grades.filter(g => g.grade === 'F' || g.grade === 'ABS').length > 0 && (
                <div className="mt-4 print:mt-2 p-4 print:p-2 bg-danger-50 print:bg-white text-danger-700 print:text-black border border-danger-100 print:border-none rounded-xl font-medium text-sm print:text-[10px]">
                  <span className="font-bold uppercase tracking-wider text-danger-800 print:text-black text-[10px] print:text-[8px] block mb-1">Resit Course(s) for this Semester:</span>
                  {currentGroup.grades.filter(g => g.grade === 'F' || g.grade === 'ABS').map(c => c.course_code).join(', ')}
                </div>
              )}
              
              {/* Global Academic Standing Inference */}
              <div className="mt-12 print:mt-4 border-t-2 border-surface-200 print:border-gray-300 pt-6 print:pt-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[10px] print:text-[8px] font-bold uppercase tracking-wider text-surface-500">Current Academic Standing</h4>
                    <p className="text-xl print:text-sm font-bold uppercase mt-1 text-surface-900 print:text-black">
                      {studentDetails.academic_status === 'normal' ? 'Pass / Proceed' :
                       studentDetails.academic_status === 'reseat' ? 'Resit Required' :
                       studentDetails.academic_status === 'repeat' ? 'Repeat Level' :
                       studentDetails.academic_status === 'withdrawn' ? 'Withdrawn' : 'Good Standing'}
                    </p>
                  </div>
                  {studentDetails.reseat_courses?.length > 0 && (
                     <div className="text-right max-w-xs">
                       <h4 className="text-[10px] print:text-[8px] font-bold uppercase tracking-wider text-surface-500">Total Outstanding Resits</h4>
                       <p className="font-bold text-danger-600 print:text-black mt-1 leading-tight text-sm print:text-[10px]">
                         {studentDetails.reseat_courses.join(', ')}
                       </p>
                     </div>
                  )}
                </div>
              </div>

              {/* Print Footer */}
              <div className="hidden print:flex items-end justify-between mt-16 pt-8 print:mt-8 print:pt-4 border-t border-gray-300">
                <div className="text-center w-48">
                  <div className="border-b border-gray-400 mb-1 h-6"></div>
                  <p className="text-[9px] font-bold text-gray-600 uppercase">Student Signature & Date</p>
                </div>
                <div className="text-center w-48">
                  <div className="border-b border-gray-400 mb-1 h-6"></div>
                  <p className="text-[9px] font-bold text-gray-600 uppercase">Head of Department</p>
                </div>
              </div>

            </motion.div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
