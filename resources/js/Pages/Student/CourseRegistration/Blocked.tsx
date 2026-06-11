import { Head, Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ShieldAlert, ArrowRight } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button } from '@/Components/UI'
import type { PageProps } from '@/types'

interface BlockedProps extends PageProps {
  message: string
}

export default function Blocked({ message }: BlockedProps) {
  return (
    <AppLayout title="Course Registration Blocked">
      <Head title="Registration Blocked" />

      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-lg"
        >
          <Card className="text-center p-8 border-danger-200 bg-danger-50/30">
            <div className="w-20 h-20 mx-auto bg-danger-100 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="text-danger-600" size={40} />
            </div>
            
            <h1 className="text-2xl font-bold text-surface-900 mb-3">Access Denied</h1>
            <p className="text-surface-600 mb-8">{message}</p>
            
            <div className="flex items-center justify-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost">Return to Dashboard</Button>
              </Link>
              <Link href="/student/fees">
                <Button variant="danger" iconRight={<ArrowRight size={16} />}>Pay Tuition Fees</Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}
