import { useState } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { 
  Send, Mail, MessageSquare, Target, Clock, Check, 
  RotateCw, AlertTriangle, CheckCircle2, ChevronRight, X, Phone, User, Search, RefreshCw
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import { formatDate } from '@/lib/utils'
import axios from 'axios'

interface AnnouncementItem {
  id: number
  title: string
  body: string
  audience: string
  send_email: boolean
  send_sms: boolean
  total_recipients?: number
  sms_sent_count?: number
  sms_failed_count?: number
  sms_pending_count?: number
  email_sent_count?: number
  email_failed_count?: number
  created_at: string
}

interface RecipientItem {
  id: number
  announcement_id: number
  recipient_name: string
  recipient_email: string | null
  recipient_phone: string | null
  formatted_phone: string | null
  sms_status: 'pending' | 'sent' | 'failed' | 'skipped'
  sms_error: string | null
  sms_message_id: string | null
  sms_sent_at: string | null
  retry_count: number
  last_attempt_at: string | null
}

interface Props {
  announcements: {
    data: AnnouncementItem[]
    links: any[]
    total: number
  }
}

export default function Announcements({ announcements }: Props) {
  const { data, setData, post, processing, errors, recentlySuccessful, reset } = useForm({
    subject: '',
    message: '',
    target: 'all',
    channel: 'both'
  })

  // State for recipient report modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null)
  const [recipients, setRecipients] = useState<RecipientItem[]>([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'failed' | 'sent'>('all')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [retryingId, setRetryingId] = useState<number | null>(null)

  // State for quick-editing phone
  const [editingRecipientId, setEditingRecipientId] = useState<number | null>(null)
  const [editPhoneValue, setEditPhoneValue] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('admission_officer.announcements.store'), {
      onSuccess: () => {
        reset('subject', 'message')
      }
    })
  }

  // Handle retry failed SMS for a specific announcement
  const handleRetryFailedSms = (announcementId: number) => {
    setRetryingId(announcementId)
    router.post(
      route('admission_officer.announcements.retry_sms', announcementId),
      {},
      {
        preserveScroll: true,
        onFinish: () => {
          setRetryingId(null)
          if (selectedAnnouncement && selectedAnnouncement.id === announcementId) {
            fetchRecipients(announcementId)
          }
        }
      }
    )
  }

  // Fetch recipients for modal inspection
  const fetchRecipients = async (announcementId: number) => {
    setLoadingRecipients(true)
    try {
      const res = await axios.get(route('admission_officer.announcements.recipients', announcementId))
      setRecipients(res.data.recipients || [])
      if (res.data.announcement) {
        setSelectedAnnouncement(prev => prev ? { ...prev, ...res.data.announcement } : null)
      }
    } catch (err) {
      console.error('Failed to load recipients report', err)
    } finally {
      setLoadingRecipients(false)
    }
  }

  const openRecipientsReport = (item: AnnouncementItem) => {
    setSelectedAnnouncement(item)
    fetchRecipients(item.id)
  }

  // Save updated phone number for a recipient
  const handleSavePhone = async (recipientId: number) => {
    if (!editPhoneValue.trim()) return
    setSavingPhone(true)
    try {
      await router.post(
        route('admission_officer.broadcast_recipients.update_phone', recipientId),
        { phone: editPhoneValue },
        {
          preserveScroll: true,
          onSuccess: () => {
            setEditingRecipientId(null)
            if (selectedAnnouncement) {
              fetchRecipients(selectedAnnouncement.id)
            }
          }
        }
      )
    } finally {
      setSavingPhone(false)
    }
  }

  // Filtered recipients in modal
  const filteredRecipients = recipients.filter(r => {
    if (recipientFilter === 'failed' && r.sms_status !== 'failed') return false
    if (recipientFilter === 'sent' && r.sms_status !== 'sent') return false
    if (recipientSearch) {
      const q = recipientSearch.toLowerCase()
      const nameMatch = r.recipient_name?.toLowerCase().includes(q)
      const phoneMatch = r.recipient_phone?.includes(q) || r.formatted_phone?.includes(q)
      const emailMatch = r.recipient_email?.toLowerCase().includes(q)
      return nameMatch || phoneMatch || emailMatch
    }
    return true
  })

  const charCount = data.message.length
  const smsSegments = Math.ceil(charCount / 160) || 1

  return (
    <AppLayout title="Broadcaster & Announcements">
      <Head title="Broadcast Desk" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-surface-900">Applicant Broadcast Desk</h1>
          <p className="text-sm text-surface-500 mt-1">
            Dispatch bulk SMS alerts via Sendar gateway or email campaigns with automated queueing and per-recipient failure retries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bulk Broadcast Form */}
        <div className="lg:col-span-2">
          <Card className="border border-surface-200 bg-white p-7 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-surface-100 mb-6">
              <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <Send size={18} className="text-brand-600" />
                Compose Campaign Broadcast
              </h2>
              <span className="text-xs text-surface-500 font-mono">
                Gateway: Sendar Transactional
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider mb-2">
                    Target Applicant Audience
                  </label>
                  <div className="relative">
                    <Target size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <select 
                      value={data.target}
                      onChange={(e) => setData('target', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    >
                      <option value="all">All Registered Applicants</option>
                      <option value="pending">Pending Application Reviews Only</option>
                      <option value="admitted">Admitted & Cleared Candidates</option>
                      <option value="rejected">Rejected Applicants Only</option>
                    </select>
                  </div>
                  {errors.target && <p className="text-xs text-danger-600 mt-1">{errors.target}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider mb-2">
                    Dispatch Delivery Channel
                  </label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <select 
                      value={data.channel}
                      onChange={(e) => setData('channel', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    >
                      <option value="both">Multi-Channel (SMS & Email Broadcast)</option>
                      <option value="sms">SMS Broadcast (Sendar Live Gateway)</option>
                      <option value="email">Email Broadcast (SMTP)</option>
                    </select>
                  </div>
                  {errors.channel && <p className="text-xs text-danger-600 mt-1">{errors.channel}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider mb-2">
                  Broadcast Subject / Header
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Schedule for Entrance Verification and Credentials Screening"
                  value={data.subject}
                  onChange={(e) => setData('subject', e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
                {errors.subject && <p className="text-xs text-danger-600 mt-1">{errors.subject}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-surface-700 uppercase tracking-wider">
                    Message Content
                  </label>
                  <span className={`text-xs ${charCount > 160 ? 'text-amber-600 font-medium' : 'text-surface-500'}`}>
                    {charCount} characters ({smsSegments} SMS page{smsSegments > 1 ? 's' : ''})
                  </span>
                </div>
                <textarea 
                  required
                  rows={6}
                  placeholder="Type your official announcement here. For SMS, keep it concise and direct..."
                  value={data.message}
                  onChange={(e) => setData('message', e.target.value)}
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none font-sans"
                />
                {errors.message && <p className="text-xs text-danger-600 mt-1">{errors.message}</p>}
                
                <p className="text-xs text-surface-500 mt-2">
                  Note: Multi-recipient batches run asynchronously on the background job queue. High-volume dispatches return immediately without page freezes or timeouts.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-surface-100">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="rounded-xl px-6 py-2.5 font-medium flex items-center gap-2"
                  loading={processing}
                >
                  {recentlySuccessful ? (
                    <>
                      <Check size={16} /> Campaign Dispatched!
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Dispatch Broadcast Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* History / Logs Sidebar */}
        <div>
          <Card className="border border-surface-200 bg-white p-6 rounded-2xl shadow-sm space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-100 pb-4 flex-shrink-0">
              <h3 className="font-semibold text-sm text-surface-900 flex items-center gap-2">
                <Clock size={16} className="text-brand-600" />
                Past Campaigns & Deliveries
              </h3>
              <Badge variant="neutral" className="text-xs">
                {announcements.total || announcements.data.length} Total
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {announcements.data.map((log) => {
                const total = log.total_recipients || 0
                const sentCount = log.sms_sent_count ?? 0
                const failedCount = log.sms_failed_count ?? 0
                const isRetrying = retryingId === log.id

                return (
                  <div 
                    key={log.id} 
                    className="bg-surface-50 border border-surface-200/70 rounded-xl p-4 space-y-3 transition-colors hover:border-surface-300"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-surface-900 text-xs leading-snug line-clamp-1">
                        {log.title}
                      </h4>
                      <span className="text-[11px] text-surface-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-surface-600 leading-relaxed line-clamp-2">
                      {log.body}
                    </p>

                    {/* Delivery Status Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-surface-200/50 text-[11px]">
                      {log.send_sms && (
                        <>
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200/60">
                            <CheckCircle2 size={12} />
                            SMS: {sentCount} sent
                          </span>

                          {failedCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-medium border border-rose-200/60">
                              <AlertTriangle size={12} />
                              {failedCount} failed
                            </span>
                          )}
                        </>
                      )}

                      {log.send_email && (
                        <span className="inline-flex items-center gap-1 text-surface-700 bg-white px-2 py-0.5 rounded-md border border-surface-200">
                          <Mail size={12} />
                          Email {log.email_sent_count ? `(${log.email_sent_count})` : ''}
                        </span>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => openRecipientsReport(log)}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        Delivery Report
                        <ChevronRight size={13} />
                      </button>

                      {/* If failed SMS exist, offer prominent Retry button */}
                      {log.send_sms && failedCount > 0 && (
                        <Button
                          variant="danger"
                          size="xs"
                          loading={isRetrying}
                          onClick={() => handleRetryFailedSms(log.id)}
                          className="rounded-lg text-[11px] px-2.5 py-1 flex items-center gap-1.5 shadow-none"
                        >
                          <RotateCw size={11} className={isRetrying ? 'animate-spin' : ''} />
                          Retry Failed ({failedCount})
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}

              {announcements.data.length === 0 && (
                <div className="text-center py-12 text-surface-500 text-xs">
                  No broadcast campaigns logged yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delivery Inspection & Retry Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-surface-100 flex items-start justify-between bg-surface-50/50">
              <div>
                <h3 className="font-semibold text-base text-surface-900 flex items-center gap-2">
                  <Clock size={16} className="text-brand-600" />
                  Campaign Delivery Report
                </h3>
                <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">
                  "{selectedAnnouncement.title}" — Broadcasted on {formatDate(selectedAnnouncement.created_at)}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedAnnouncement(null)}
                className="text-surface-400 hover:text-surface-700 p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Metrics Bar & Filters */}
            <div className="px-6 py-3 border-b border-surface-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${recipientFilter === 'all' ? 'bg-surface-900 text-white' : 'bg-surface-100 text-surface-700 hover:bg-surface-200'}`}
                >
                  All ({recipients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientFilter('failed')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${recipientFilter === 'failed' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                >
                  Failed ({recipients.filter(r => r.sms_status === 'failed').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientFilter('sent')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${recipientFilter === 'sent' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  Sent ({recipients.filter(r => r.sms_status === 'sent').length})
                </button>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search recipient name, phone..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-surface-50 border border-surface-200 rounded-lg text-xs w-full sm:w-64 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Recipient List Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loadingRecipients ? (
                <div className="py-12 flex flex-col items-center justify-center text-surface-500 text-xs gap-2">
                  <RotateCw size={18} className="animate-spin text-brand-600" />
                  Loading delivery breakdown...
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="py-12 text-center text-surface-400 text-xs italic">
                  No recipients match current filter.
                </div>
              ) : (
                <div className="divide-y divide-surface-100 border border-surface-200 rounded-xl overflow-hidden">
                  {filteredRecipients.map((r) => {
                    const isEditing = editingRecipientId === r.id
                    return (
                      <div key={r.id} className="p-3.5 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-surface-50/50 transition-colors">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-surface-900">{r.recipient_name}</p>
                          <div className="flex items-center gap-3 text-surface-500 text-[11px]">
                            {r.recipient_email && <span>{r.recipient_email}</span>}
                            <span>•</span>
                            <span className="font-mono text-surface-700">{r.recipient_phone || 'No phone provided'}</span>
                          </div>
                          {r.sms_error && (
                            <p className="text-[11px] text-rose-600 font-medium pt-0.5 flex items-center gap-1">
                              <AlertTriangle size={11} /> {r.sms_error}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {r.sms_status === 'sent' && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-200/60">
                              <CheckCircle2 size={12} />
                              Sent {r.sms_message_id ? `(#${r.sms_message_id.slice(0, 8)})` : ''}
                            </span>
                          )}

                          {r.sms_status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md font-medium border border-amber-200/60">
                              <Clock size={12} />
                              Pending
                            </span>
                          )}

                          {r.sms_status === 'failed' && (
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="080..."
                                    value={editPhoneValue}
                                    onChange={(e) => setEditPhoneValue(e.target.value)}
                                    className="px-2 py-1 text-xs border border-surface-300 rounded-md w-32 outline-none font-mono"
                                  />
                                  <Button
                                    size="xs"
                                    variant="primary"
                                    loading={savingPhone}
                                    onClick={() => handleSavePhone(r.id)}
                                  >
                                    Save
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingRecipientId(null)}
                                    className="text-surface-400 hover:text-surface-700 p-1"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md font-medium border border-rose-200/60">
                                    <AlertTriangle size={12} />
                                    Failed {r.retry_count > 0 ? `(${r.retry_count}x)` : ''}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRecipientId(r.id)
                                      setEditPhoneValue(r.recipient_phone || '')
                                    }}
                                    className="text-[11px] text-surface-500 hover:text-brand-600 underline cursor-pointer"
                                  >
                                    Fix Phone
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-surface-100 bg-surface-50 flex items-center justify-between text-xs">
              <span className="text-surface-500">
                {recipients.filter(r => r.sms_status === 'sent').length} delivered, {recipients.filter(r => r.sms_status === 'failed').length} failed
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>

                {recipients.some(r => r.sms_status === 'failed') && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={retryingId === selectedAnnouncement.id}
                    onClick={() => handleRetryFailedSms(selectedAnnouncement.id)}
                    className="rounded-xl flex items-center gap-1.5"
                  >
                    <RotateCw size={13} className={retryingId === selectedAnnouncement.id ? 'animate-spin' : ''} />
                    Retry Only Failed SMS
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
