import { useState } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, Plus, Search, Edit2, Trash2, X, Wallet,
  Calendar, Award, Layers, Eye, FileText
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import { formatCurrency } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  fees: {
    data: any[]
    links: any[]
    total: number
  }
  departments: Array<{ id: number; name: string }>
  academic_sessions: Array<{ id: number; name: string }>
}

export default function FeeIndex({ fees, departments, academic_sessions, auth }: Props) {
  const isProvost = (auth.user?.role as string) === 'provost' || (auth.user as any)?.roles?.includes('provost') || (auth.user as any)?.roles?.map((r: any) => r.name).includes('provost');
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<any | null>(null)
  const [viewingFeeBreakdown, setViewingFeeBreakdown] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    fee_type: 'tuition',
    amount: '',
    academic_session_id: '',
    department_id: '',
    level: [] as string[],
    breakdown: [] as Array<{ item: string; cost: number }>,
    custom_fee_type: ''
  })

  const handleEditClick = (fee: any) => {
    setEditingFee(fee)
    setData({
      name: fee.name || '',
      fee_type: fee.fee_type || 'tuition',
      amount: fee.amount?.toString() || '',
      academic_session_id: fee.academic_session_id?.toString() || '',
      department_id: fee.department_id?.toString() || '',
      level: fee.level ? fee.level.split(',') : [],
      breakdown: fee.metadata?.breakdown || [],
      custom_fee_type: fee.metadata?.custom_fee_type || ''
    })
    setModalOpen(true)
  }

  const handleDeleteFee = (feeId: number) => {
    if (confirm('Are you sure you want to delete this fee schedule? Any existing unpaid invoices linked to this schedule may be affected.')) {
      router.delete(`/bursary/fees/${feeId}`, {
        onSuccess: () => {
          alert('Fee schedule structure deleted successfully.')
        }
      })
    }
  }

  const handleLevelToggle = (lvl: string) => {
    const current = [...data.level]
    const idx = current.indexOf(lvl)
    if (idx > -1) {
      current.splice(idx, 1)
    } else {
      current.push(lvl)
    }
    setData('level', current)
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
    if (editingFee) {
      post(`/bursary/fees/${editingFee.id}/update`, {
        onSuccess: () => {
          setModalOpen(false)
          setEditingFee(null)
          reset()
        }
      })
    } else {
      post('/bursary/fees', {
        onSuccess: () => {
          setModalOpen(false)
          reset()
        }
      })
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingFee(null)
    reset()
  }

  const filteredFees = fees.data.filter(fee => 
    fee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fee.fee_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fee.metadata?.custom_fee_type && fee.metadata.custom_fee_type.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <AppLayout title="Fee Schedules">
      <Head title="Financial Management - Fees" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Fee Schedules</h1>
           <p className="text-sm text-surface-500 mt-1">Configure and manage tuition, departmental levies, and other institutional charges.</p>
        </div>
        <div className="flex gap-2">
           {!isProvost && (
             <Button 
               variant="brand" 
               size="sm" 
               iconLeft={<Plus size={16} />}
               onClick={() => setModalOpen(true)}
             >
               Create Fee Structure
             </Button>
           )}
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
              <input 
                type="text" 
                placeholder="Search fees by name or category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Fee Name</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Category</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Target Group</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Session</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500">Amount</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-surface-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-surface-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-surface-900">{fee.name}</p>
                        {fee.metadata?.breakdown?.length > 0 && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-brand-600">
                            <Layers size={10} /> {fee.metadata.breakdown.length} components
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral" className="capitalize">
                      {fee.fee_type === 'other' && fee.metadata?.custom_fee_type 
                        ? fee.metadata.custom_fee_type 
                        : fee.fee_type.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-surface-600">
                       <p className="font-bold">{fee.department?.name || 'All Departments'}</p>
                       <p className="text-surface-400 mt-0.5">
                         {fee.level 
                           ? `Levels ${fee.level.split(',').join(', ')}` 
                           : 'All Levels'}
                       </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-surface-500">
                    {fee.academic_session?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-surface-900">
                    {formatCurrency(fee.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                       {fee.metadata?.breakdown?.length > 0 && (
                         <button 
                           onClick={() => setViewingFeeBreakdown(fee)}
                           className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-brand-600 transition-colors"
                           title="View Breakdown"
                         >
                            <Eye size={16} />
                         </button>
                       )}
                       {!isProvost && (
                         <>
                           <button 
                             onClick={() => handleEditClick(fee)}
                             className="p-2 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-brand-600 transition-colors"
                             title="Edit"
                           >
                              <Edit2 size={16} />
                           </button>
                           <button 
                             onClick={() => handleDeleteFee(fee.id)}
                             className="p-2 rounded-lg text-danger-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
                             title="Delete"
                           >
                              <Trash2 size={16} />
                           </button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFees.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-surface-400 italic text-sm">
                      No matching fee structures configured.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Fee Creation/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={handleCloseModal} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Wallet className="text-brand-600" size={20} />
                    <h3 className="font-bold text-surface-900">
                      {editingFee ? 'Modify Fee Structure' : 'Create New Fee Structure'}
                    </h3>
                  </div>
                  <button onClick={handleCloseModal} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Fee Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Tuition Fee, Hostel Fee"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      />
                      {errors.name && <p className="text-xs text-danger-500 mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Category Type</label>
                        <select 
                          value={data.fee_type}
                          onChange={(e) => setData('fee_type', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        >
                          <option value="tuition">Tuition</option>
                          <option value="departmental">Departmental Levy</option>
                          <option value="acceptance">Acceptance Fee</option>
                          <option value="hostel">Hostel Accommodation</option>
                          <option value="dues">Semester Dues</option>
                          <option value="other">Other / Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Academic Session</label>
                        <select 
                          required
                          value={data.academic_session_id}
                          onChange={(e) => setData('academic_session_id', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        >
                          <option value="">-- Choose Session --</option>
                          {academic_sessions.map((session) => (
                             <option key={session.id} value={session.id}>{session.name}</option>
                          ))}
                        </select>
                        {errors.academic_session_id && <p className="text-xs text-danger-500 mt-1">{errors.academic_session_id}</p>}
                      </div>
                    </div>

                    {/* Specify category if 'other' is selected */}
                    {data.fee_type === 'other' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -8 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="p-4 bg-surface-50 rounded-xl border border-surface-100"
                      >
                        <label className="block text-xs font-bold text-brand-700 uppercase tracking-wider mb-2">Specify Custom Category Name</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Graduation Levy, Sports Development Charges"
                          value={data.custom_fee_type}
                          onChange={(e) => setData('custom_fee_type', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        />
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Target Department (Optional)</label>
                        <select 
                          value={data.department_id}
                          onChange={(e) => setData('department_id', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                        >
                          <option value="">All Departments (General)</option>
                          {departments.map((dept) => (
                             <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Target Levels (Select All That Apply)</label>
                        <div className="grid grid-cols-2 gap-2.5 p-2 bg-surface-50 rounded-xl border border-surface-150">
                           {['100', '200', '300', '400'].map((lvl) => {
                             const isChecked = data.level.includes(lvl)
                             return (
                               <label key={lvl} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors select-none">
                                 <input 
                                   type="checkbox"
                                   checked={isChecked}
                                   onChange={() => handleLevelToggle(lvl)}
                                   className="w-4 h-4 rounded text-brand-600 border-surface-300 focus:ring-brand-500/20 transition-all"
                                 />
                                 <span className="text-xs font-semibold text-surface-700">{lvl} Level</span>
                               </label>
                             )
                           })}
                        </div>
                        <p className="text-[10px] text-surface-400 mt-1 italic">Leave all unchecked to apply to all academic levels.</p>
                      </div>
                    </div>

                    {/* Breakdown items */}
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-surface-100 mb-4">
                         <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Fee Components Breakdown (Optional)</span>
                         <Button type="button" variant="outline" size="sm" onClick={handleAddBreakdownItem}>Add Component</Button>
                      </div>

                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                         {data.breakdown.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                               <input 
                                 type="text"
                                 placeholder="e.g. Tuition, Library fee, Exam dues"
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
                            <p className="text-xs text-surface-400 italic">No breakdown items added. Cost will be defined globally as a flat schedule fee.</p>
                         )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Overall Schedule Cost / Amount (NGN)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={data.amount}
                        disabled={data.breakdown.length > 0}
                        onChange={(e) => setData('amount', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                          data.breakdown.length > 0 
                            ? 'bg-surface-100 text-surface-500 border-surface-250 cursor-not-allowed font-bold' 
                            : 'bg-white border-surface-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
                        }`}
                      />
                      {data.breakdown.length > 0 && (
                        <p className="text-[10px] text-brand-600 mt-1 italic font-semibold">Amount is automatically calculated from the breakdown components sum.</p>
                      )}
                      {errors.amount && <p className="text-xs text-danger-500 mt-1">{errors.amount}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 flex-shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={handleCloseModal}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" loading={processing}>
                      {editingFee ? 'Save Changes' : 'Publish Fee Structure'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Breakdown Components Modal */}
      <AnimatePresence>
        {viewingFeeBreakdown && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setViewingFeeBreakdown(null)} />
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
                    <h3 className="font-bold text-surface-900">Fee Component Breakdown</h3>
                  </div>
                  <button onClick={() => setViewingFeeBreakdown(null)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                     <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">Fee Schedule Name</p>
                     <p className="text-sm font-bold text-surface-800">{viewingFeeBreakdown.name}</p>
                  </div>

                  <div className="space-y-1">
                     <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">Aggregate Value</p>
                     <p className="text-md font-extrabold text-brand-600">{formatCurrency(viewingFeeBreakdown.amount)}</p>
                  </div>

                  <div className="border-t border-surface-100 pt-3">
                     <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-3">Item Breakdown</p>
                     <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {viewingFeeBreakdown.metadata?.breakdown?.map((item: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center bg-surface-50 p-2.5 rounded-xl border border-surface-100">
                              <span className="text-sm font-semibold text-surface-700">{item.item}</span>
                              <span className="text-sm font-bold text-surface-900">{formatCurrency(item.cost)}</span>
                           </div>
                        ))}
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
