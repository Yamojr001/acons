import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { 
  Trophy, BookOpen, Download, ChevronRight, 
  Search, Filter, Award, Star
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Badge, Button, EmptyState } from '@/Components/UI'
import type { PageProps } from '@/types'

interface ResultGroup {
  session_name: string
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
}

export default function StudentResults({ groupedResults }: Props) {
  const groups = Object.values(groupedResults)

  return (
    <AppLayout title="My Academic Records">
      <Head title="Academic Results" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Academic Transcript</h1>
          <p className="text-sm text-surface-500 mt-1">View your official semester-by-semester performance history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconLeft={<Download size={16} />}>Export PDF</Button>
        </div>
      </div>

      <div className="space-y-10">
        {groups.length > 0 ? groups.map((group, groupIdx) => (
          <motion.div 
            key={group.session_name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIdx * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900 leading-none">{group.session_name}</h3>
                  <p className="text-xs text-surface-400 mt-1 uppercase tracking-widest font-bold">Consolidated Result</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-surface-400 uppercase font-bold mb-0.5">Semester GPA</p>
                <p className="text-2xl font-display font-bold text-brand-600">{group.semester_gpa.toFixed(2)}</p>
              </div>
            </div>

            <Card padding="none" className="overflow-hidden border-surface-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-50 text-[10px] uppercase tracking-wider text-surface-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">Course Code</th>
                      <th className="px-6 py-4">Course Title</th>
                      <th className="px-6 py-4 text-center">Units</th>
                      <th className="px-6 py-4 text-center">Score</th>
                      <th className="px-6 py-4 text-center">Grade</th>
                      <th className="px-6 py-4 text-center">GP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 bg-white">
                    {group.grades.map((g, i) => (
                      <tr key={i} className="hover:bg-surface-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-bold text-surface-900 bg-surface-100 px-2 py-1 rounded-md">{g.course_code}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-surface-700 font-medium">{g.course_name}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-surface-600">{g.units}</td>
                        <td className="px-6 py-4 text-center text-sm font-mono font-bold text-surface-900">{g.score}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs
                            ${['A', 'B'].includes(g.grade) ? 'bg-success-100 text-success-700' : 
                              ['C', 'D'].includes(g.grade) ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700'}`}>
                            {g.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-surface-900">{g.points.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )) : (
          <Card className="py-20 text-center">
            <EmptyState
              title="No Results Yet"
              description="Your academic records will appear here as soon as they are approved by the Senate."
              icon={<Award size={48} className="text-surface-200" />}
            />
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
