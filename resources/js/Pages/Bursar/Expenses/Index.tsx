import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, Plus, DollarSign, Calendar, Tag, FileText,
  AlertCircle, X, CheckCircle, ChevronDown, Eye
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  expenses: {
    data: any[]
    links: any[]
    total: number
  }
}

export default function ExpensesIndex({ expenses, auth }: Props) {
  const isProvost = (auth.user?.role as string) === 'provost' || (auth.user as any)?.roles?.includes('provost') || (auth.user as any)?.roles?.map((r: any) => r.name).includes('provost');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [viewingExpense, setViewingExpense] = useState<any | null>(null)

  const { data, setData, post, processing, errors, reset } = useForm({
    title: '',
    category: 'Utilities',
    amount: '',
    reference: 'EXP-' + nowString(),
    breakdown: [] as Array<{ item: string; cost: number }>
  })

  function nowString() {
    return Math.floor(100000 + Math.random() * 900000).toString()
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/bursary/expenses', {
      onSuccess: () => {
        setExpenseModalOpen(false)
        reset()
        setData('reference', 'EXP-' + nowString())
      }
    })
  }

  return (
    <AppLayout title="Institutional Expenses">
      <Head title="Expense Management" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Institutional Expenses</h1>
           <p className="text-sm text-surface-500 mt-1">Track administrative spending and operational cost breakdowns.</p>
        </div>
        <div>
           {!isProvost && (
             <Button 
               variant="primary" 
               size="sm" 
               iconLeft={<Plus size={16} />}
               onClick={() => setExpenseModalOpen(true)}
             >
               Record Expense
             </Button>
           )}
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Title / Category</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Reference</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Record Date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Amount</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Recorded By</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {expenses.data.map((expense) => {
                const title = expense.metadata?.title || 'N/A'
                const category = expense.metadata?.category || 'General'
                return (
                  <tr key={expense.id} className="hover:bg-surface-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-100 text-surface-600 flex items-center justify-center">
                           <CreditCard size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-surface-900">{title}</p>
                          <p className="text-[10px] font-semibold text-surface-400 mt-0.5 capitalize">{category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-surface-500">
                      {expense.reference}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600">
                      {formatDate(expense.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-surface-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-500">
                      {expense.user?.name || 'System'}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            iconLeft={<Eye size={14} />}
                            onClick={() => setViewingExpense(expense)}
                          >
                            Breakdown
                          </Button>
                       </div>
                    </td>
                  </tr>
                )
              })}
              {expenses.data.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-surface-400 italic text-sm">
                      No expense logs found. Click "Record Expense" to register administrative costs.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Expense Modal */}
      <AnimatePresence>
        {expenseModalOpen && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setExpenseModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="text-brand-600" size={20} />
                    <h3 className="font-bold text-surface-900">Record Institutional Expense</h3>
                  </div>
                  <button onClick={() => setExpenseModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Title</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Purchase of Lab Chalk"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      />
                      {errors.title && <p className="text-xs text-danger-500 mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Category</label>
                      <select 
                        value={data.category}
                        onChange={(e) => setData('category', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      >
                        <option value="Utilities">Utilities</option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Amount (NGN)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      />
                      {errors.amount && <p className="text-xs text-danger-500 mt-1">{errors.amount}</p>}
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
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Spending Breakdown (Optional)</span>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddBreakdownItem}>Add Item</Button>
                     </div>

                     <div className="space-y-3">
                        {data.breakdown.map((item, idx) => (
                           <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                placeholder="Item name"
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
                           <p className="text-xs text-surface-400 italic">No breakdown items added. Total amount will be recorded as a single bulk expense.</p>
                        )}
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 flex-shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" loading={processing}>
                      Record Expense
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
        {viewingExpense && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setViewingExpense(null)} />
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
                    <h3 className="font-bold text-surface-900">Expense Cost Breakdown</h3>
                  </div>
                  <button onClick={() => setViewingExpense(null)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                     <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">Expense Title</p>
                     <p className="text-sm font-bold text-surface-800">{viewingExpense.metadata?.title || 'N/A'}</p>
                  </div>

                  <div className="space-y-1">
                     <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">Total Amount</p>
                     <p className="text-md font-extrabold text-surface-950">{formatCurrency(viewingExpense.amount)}</p>
                  </div>

                  <div className="border-t border-surface-100 pt-3">
                     <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-3">Item Breakdown</p>
                     <div className="space-y-2">
                        {viewingExpense.metadata?.breakdown?.map((item: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center bg-surface-50 p-2.5 rounded-xl border border-surface-100">
                              <span className="text-sm font-semibold text-surface-700">{item.item}</span>
                              <span className="text-sm font-bold text-surface-900">{formatCurrency(item.cost)}</span>
                           </div>
                        ))}
                        {(!viewingExpense.metadata?.breakdown || viewingExpense.metadata.breakdown.length === 0) && (
                           <p className="text-sm text-surface-400 italic">No breakdown items available for this expense.</p>
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
