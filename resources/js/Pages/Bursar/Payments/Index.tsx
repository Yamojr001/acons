import { useState } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, Plus, DollarSign, Calendar, Tag, FileText,
  AlertCircle, X, CheckCircle, ChevronDown, Eye, User, CreditCard,
  Edit2, Trash2, FileDown
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  payments: {
    data: any[]
    links: any[]
    total: number
  }
  students: Array<{ id: number; name: string }>
  fees: Array<{ id: number; name: string; amount: number }>
  stats: {
    total_income: number
    total_spent: number
    current_balance: number
  }
}

export default function PaymentsIndex({ payments, students, fees, stats, auth }: Props) {
  const isProvost = (auth.user?.role as string) === 'provost' || (auth.user as any)?.roles?.includes('provost') || (auth.user as any)?.roles?.map((r: any) => r.name).includes('provost');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [viewingPayment, setViewingPayment] = useState<any | null>(null)
  const [editingPayment, setEditingPayment] = useState<any | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const { data, setData, post, processing, errors, reset } = useForm({
    student_id: '',
    fee_id: '',
    amount: '',
    reference: 'PAY-' + nowString(),
    payment_gateway: 'bank_transfer',
    breakdown: [] as Array<{ item: string; cost: number }>
  })

  function nowString() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleFeeChange = (feeId: string) => {
    setData('fee_id', feeId)
    const selectedFee = fees.find(f => f.id.toString() === feeId)
    if (selectedFee) {
      setData('amount', selectedFee.amount.toString())
    }
  }

  const handleAddBreakdownItem = () => {
    setData('breakdown', [
      ...data.breakdown,
      { item: '', cost: 0 }
    ])
  }

  const handleRemoveBreakdownItem = (index: number) => {
    const updated = [...data.breakdown]
    updated.splice(index, 1)
    setData('breakdown', updated)
    updateTotalAmount(updated)
  }

  const handleBreakdownChange = (index: number, field: 'item' | 'cost', value: string | number) => {
    const updated = [...data.breakdown]
    if (field === 'cost') {
      updated[index].cost = parseFloat(value as string) || 0
    } else {
      updated[index].item = value as string
    }
    setData('breakdown', updated)
    updateTotalAmount(updated)
  }

  const updateTotalAmount = (items: Array<{ item: string; cost: number }>) => {
    const sum = items.reduce((acc, curr) => acc + curr.cost, 0)
    if (sum > 0) {
      setData('amount', sum.toString())
    }
  }

  const handleEditClick = (payment: any) => {
    setEditingPayment(payment)
    setData({
      student_id: payment.student_id?.toString() || payment.student?.id?.toString() || '',
      fee_id: payment.student_invoice?.fee_id?.toString() || payment.student_invoice_id?.toString() || '',
      amount: payment.amount?.toString() || '',
      reference: payment.reference || '',
      payment_gateway: payment.payment_gateway || 'bank_transfer',
      breakdown: payment.metadata?.breakdown || []
    })
    setPaymentModalOpen(true)
  }

  const handleDeletePayment = (paymentId: number) => {
    if (confirm('Are you sure you want to delete this payment record? This action will adjust the student\'s invoice balance.')) {
      router.delete(`/bursary/payments/${paymentId}`, {
        onSuccess: () => {
          alert('Payment record deleted successfully.')
        }
      })
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPayment) {
      post(`/bursary/payments/${editingPayment.id}/update`, {
        onSuccess: () => {
          alert('Transaction history is updated')
          setPaymentModalOpen(false)
          setEditingPayment(null)
          reset()
          setData('reference', 'PAY-' + nowString())
        }
      })
    } else {
      post('/bursary/payments/manual', {
        onSuccess: () => {
          alert('Payment recorded successfully!')
          setPaymentModalOpen(false)
          reset()
          setData('reference', 'PAY-' + nowString())
        }
      })
    }
  }

  return (
    <AppLayout title="Transaction Logs">
      <Head title="Transaction Directory" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Transaction Logs</h1>
           <p className="text-sm text-surface-500 mt-1">Review student payments and record manual receipts.</p>
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
                 Export Transactions
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
                         href="/bursary/payments/export/pdf" 
                         target="_blank" 
                         className="flex items-center px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                         onClick={() => setExportOpen(false)}
                       >
                         Download PDF Report
                       </a>
                       <a 
                         href="/bursary/payments/export/csv" 
                         className="flex items-center px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                         onClick={() => setExportOpen(false)}
                       >
                         Download CSV (Excel)
                       </a>
                       <a 
                         href="/bursary/payments/export/xlsx" 
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
            
            {!isProvost && (
              <Button 
                variant="primary" 
                size="sm" 
                iconLeft={<Plus size={16} />}
                onClick={() => setPaymentModalOpen(true)}
              >
                Record Manual Payment
              </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3 mb-2 text-success-500">
            <DollarSign size={18} />
            <span className="font-semibold text-sm">Total Income</span>
          </div>
          <div className="text-3xl font-bold text-surface-900">{formatCurrency(stats.total_income)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-2 text-danger-500">
            <Tag size={18} />
            <span className="font-semibold text-sm">Total Spent (Expenditure)</span>
          </div>
          <div className="text-3xl font-bold text-surface-900">{formatCurrency(stats.total_spent)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-2 text-brand-500">
            <Wallet size={18} />
            <span className="font-semibold text-sm">Current Balance</span>
          </div>
          <div className="text-3xl font-bold text-surface-900">{formatCurrency(stats.current_balance)}</div>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Student Info</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Reference</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Method</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Date Paid</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Amount</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {payments.data.map((payment) => {
                const studentName = payment.student?.user?.name || 'Unknown Student'
                const studentDept = payment.student?.department?.code || 'N/A'
                return (
                  <tr key={payment.id} className="hover:bg-surface-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={studentName} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-surface-900">{studentName}</p>
                          <p className="text-[10px] font-semibold text-surface-400 mt-0.5">{studentDept}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-surface-500">
                      {payment.reference}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600 capitalize">
                      {payment.payment_gateway.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-surface-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={payment.status === 'successful' ? 'success' : 'warning'} className="capitalize">
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            iconLeft={<Eye size={14} />}
                            onClick={() => setViewingPayment(payment)}
                          >
                            Breakdown
                          </Button>
                          {!isProvost && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                iconLeft={<Edit2 size={13} />}
                                onClick={() => handleEditClick(payment)}
                              />
                              {payment.payment_gateway === 'cash' ? (
                                <Button 
                                  variant="danger" 
                                  size="sm" 
                                  iconLeft={<Trash2 size={13} />}
                                  onClick={() => handleDeletePayment(payment.id)}
                                />
                              ) : (
                                <div className="inline-flex items-center justify-center p-2 text-surface-400 bg-surface-50 border border-surface-200 rounded-xl cursor-not-allowed select-none" title="Audit Locked: Non-cash payments cannot be deleted to prevent tampering.">
                                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                   </svg>
                                </div>
                              )}
                            </>
                          )}
                       </div>
                    </td>
                  </tr>
                )
              })}
              {payments.data.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-surface-400 italic text-sm">
                      No payment transactions recorded yet.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Manual Payment Modal */}
      <AnimatePresence>
        {paymentModalOpen && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setPaymentModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Wallet className="text-brand-600" size={20} />
                    <h3 className="font-bold text-surface-900">Record Manual Student Payment</h3>
                  </div>
                  <button onClick={() => setPaymentModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-4">
                    {editingPayment && editingPayment.payment_gateway !== 'cash' && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                        <div className="text-xs text-amber-800">
                          <p className="font-bold">Audit Safety Alert</p>
                          <p className="mt-1">This is a non-cash payment ({editingPayment.payment_gateway}). To preserve the audit trail and prevent tampering, submitting changes will log a **new revision transaction** rather than overwriting the original log.</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Select Student</label>
                      <select 
                        required
                        value={data.student_id}
                        onChange={(e) => setData('student_id', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      >
                        <option value="">-- Choose Student --</option>
                        {students.map((student) => (
                           <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                      </select>
                      {errors.student_id && <p className="text-xs text-danger-500 mt-1">{errors.student_id}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Select Fee Schedule</label>
                      <select 
                        required
                        value={data.fee_id}
                        onChange={(e) => handleFeeChange(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      >
                        <option value="">-- Choose Fee --</option>
                        {fees.map((fee) => (
                           <option key={fee.id} value={fee.id}>{fee.name}</option>
                        ))}
                      </select>
                      {errors.fee_id && <p className="text-xs text-danger-500 mt-1">{errors.fee_id}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Amount Paid (NGN)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          value={data.amount}
                          onChange={(e) => setData('amount', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        />
                        {errors.amount && <p className="text-xs text-danger-500 mt-1">{errors.amount}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Payment Gateway / Method</label>
                        <select 
                          value={data.payment_gateway}
                          onChange={(e) => setData('payment_gateway', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        >
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash Payment</option>
                          <option value="paystack">Paystack Gateway</option>
                          <option value="remita">Remita RRR</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Reference Code</label>
                      <input 
                        type="text" 
                        required
                        value={data.reference}
                        onChange={(e) => setData('reference', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                     <div className="flex items-center justify-between pb-2 border-b border-surface-100 mb-4">
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Fee Components Breakdown (Optional)</span>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddBreakdownItem}>Add Component</Button>
                     </div>

                     <div className="space-y-3">
                        {data.breakdown.map((item, idx) => (
                           <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                placeholder="e.g. Tuition, Library, Lab"
                                required
                                value={item.item}
                                onChange={(e) => handleBreakdownChange(idx, 'item', e.target.value)}
                                className="flex-1 px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                              />
                              <input 
                                type="number"
                                placeholder="Cost"
                                required
                                value={item.cost || ''}
                                onChange={(e) => handleBreakdownChange(idx, 'cost', e.target.value)}
                                className="w-32 px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRemoveBreakdownItem(idx)}
                                className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                              >
                                 <X size={16} />
                              </button>
                           </div>
                        ))}
                        {data.breakdown.length === 0 && (
                           <p className="text-xs text-surface-400 italic">No itemized breakdown added. Payment will be logged in full without distinct sub-components.</p>
                        )}
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 flex-shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                     <Button type="submit" variant="primary" size="sm" loading={processing}>
                       {editingPayment 
                         ? (editingPayment.payment_gateway === 'cash' ? 'Save Changes' : 'Generate Revision Entry') 
                         : 'Confirm Payment'}
                     </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Breakdown Modal */}
      <AnimatePresence>
        {viewingPayment && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setViewingPayment(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="text-brand-600" size={20} />
                    <h3 className="font-bold text-surface-900">Payment Fee Components</h3>
                  </div>
                  <button onClick={() => setViewingPayment(null)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                     <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">Student</p>
                     <p className="text-sm font-bold text-surface-800">{viewingPayment.student?.user?.name}</p>
                  </div>

                  <div className="space-y-1">
                     <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">Total Amount Paid</p>
                     <p className="text-md font-extrabold text-surface-950">{formatCurrency(viewingPayment.amount)}</p>
                  </div>

                  <div className="border-t border-surface-100 pt-3">
                     <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-3">Item Breakdown</p>
                     <div className="space-y-2">
                        {viewingPayment.metadata?.breakdown?.map((item: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center bg-surface-50 p-2.5 rounded-xl border border-surface-100">
                              <span className="text-sm font-semibold text-surface-700">{item.item}</span>
                              <span className="text-sm font-bold text-surface-900">{formatCurrency(item.cost)}</span>
                           </div>
                        ))}
                        {(!viewingPayment.metadata?.breakdown || viewingPayment.metadata.breakdown.length === 0) && (
                           <p className="text-sm text-surface-400 italic">No breakdown items available for this payment.</p>
                        )}
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

function Avatar({ name, size }: { name: string; size?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <div className={`w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs`}>
      {initials}
    </div>
  )
}
