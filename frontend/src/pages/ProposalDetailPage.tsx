import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, Send, PenLine, ThumbsUp, ThumbsDown,
  RotateCcw, Clock, User, Building2, Mail, Phone, Calendar,
} from 'lucide-react'
import api from '../api/client'
import { Proposal } from '../api/types'
import { StatusBadge } from '../components/StatusBadge'
import { useAuthStore } from '../store/authStore'

function fmtMoney(n: number) {
  return n.toLocaleString('ru-KZ', { minimumFractionDigits: 2 }) + ' ₸'
}
function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('ru-KZ', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_STEPS = [
  { key: 'draft', label: 'Сформировано' },
  { key: 'on_approval', label: 'На согласовании' },
  { key: 'signed_head', label: 'Подписано руководителем' },
  { key: 'sent_client', label: 'Отправлено клиенту' },
]
const STATUS_ORDER = ['draft', 'signed_manager', 'on_approval', 'signed_head', 'sent_client']

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    api.get<Proposal>(`/proposals/${id}`).then((r) => {
      setProposal(r.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [id])

  const action = async (url: string, body?: object) => {
    setActionLoading(true)
    setError('')
    try {
      const res = await api.post<Proposal>(url, body ?? {})
      setProposal(res.data)
      setShowRejectForm(false)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Ошибка выполнения действия')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="py-16 text-center text-gray-400">Загрузка...</div>
  if (!proposal) return <div className="py-16 text-center text-gray-400">КП не найдено</div>

  const isManager = user?.id === proposal.manager.id || user?.role === 'admin'
  const isHead = user?.role === 'head' || user?.role === 'admin'
  const currentStepIdx = STATUS_ORDER.indexOf(proposal.status)
  const isRejected = proposal.status === 'rejected'

  return (
    <div className="space-y-5">
      {/* Back + Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('/proposals')} className="btn-secondary">
          <ArrowLeft size={16} /> Реестр КП
        </button>
        <div className="flex flex-wrap gap-2">
          {proposal.pdf_path && (
            <a href={`/api/proposals/${proposal.id}/pdf`} target="_blank" rel="noreferrer"
              className="btn-secondary">
              <Download size={16} /> Скачать PDF
            </a>
          )}
          {/* Manager: sign */}
          {isManager && proposal.status === 'draft' && (
            <button className="btn-primary" disabled={actionLoading}
              onClick={() => action(`/proposals/${proposal.id}/sign-manager`)}>
              <PenLine size={16} />
              {actionLoading ? 'Подписание...' : 'Подписать ЭЦП и отправить на согласование'}
            </button>
          )}
          {/* Head: approve */}
          {isHead && proposal.status === 'on_approval' && !showRejectForm && (
            <>
              <button className="btn-success" disabled={actionLoading}
                onClick={() => action(`/proposals/${proposal.id}/approve`)}>
                <ThumbsUp size={16} />
                {actionLoading ? '...' : 'Подписать и одобрить'}
              </button>
              <button className="btn-danger" onClick={() => setShowRejectForm(true)}>
                <ThumbsDown size={16} /> Отклонить
              </button>
            </>
          )}
          {/* Manager: send to client */}
          {isManager && proposal.status === 'signed_head' && (
            <button className="btn-success" disabled={actionLoading}
              onClick={() => action(`/proposals/${proposal.id}/send`)}>
              <Send size={16} />
              {actionLoading ? 'Отправка...' : 'Отправить клиенту'}
            </button>
          )}
          {/* Manager: resubmit after rejection */}
          {isManager && isRejected && (
            <button className="btn-secondary" disabled={actionLoading}
              onClick={() => action(`/proposals/${proposal.id}/resubmit`)}>
              <RotateCcw size={16} />
              {actionLoading ? '...' : 'Вернуть на доработку'}
            </button>
          )}
        </div>
      </div>

      {/* Reject form */}
      {showRejectForm && (
        <div className="card p-5 border-red-200 bg-red-50 space-y-3">
          <h3 className="font-semibold text-red-700">Причина отклонения</h3>
          <textarea
            className="input h-24 resize-none"
            placeholder="Укажите причину отклонения КП..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn-danger" disabled={!rejectComment || actionLoading}
              onClick={() => action(`/proposals/${proposal.id}/reject`, { comment: rejectComment })}>
              Отклонить КП
            </button>
            <button className="btn-secondary" onClick={() => setShowRejectForm(false)}>Отмена</button>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Progress tracker */}
      {!isRejected ? (
        <div className="card p-5">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => {
              const done = STATUS_ORDER.indexOf(step.key) <= currentStepIdx
              const active = step.key === proposal.status ||
                (step.key === 'draft' && proposal.status === 'signed_manager')
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      done ? 'bg-brand-700 border-brand-700 text-white' : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    <span className={`text-xs text-center w-20 ${done ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-5 mx-1 ${
                      STATUS_ORDER.indexOf(STATUS_STEPS[i + 1].key) <= currentStepIdx
                        ? 'bg-brand-700' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="card p-4 bg-red-50 border-red-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">✕</div>
          <div>
            <p className="font-semibold text-red-700">КП отклонено</p>
            {proposal.head_comment && <p className="text-sm text-red-600 mt-1">Причина: {proposal.head_comment}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header card */}
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div>
                <h1 className="text-xl font-bold font-mono text-gray-900">{proposal.number}</h1>
                <div className="mt-1"><StatusBadge status={proposal.status} /></div>
              </div>
              <div className="text-sm text-gray-500 text-right">
                <p>Создано: {fmtDate(proposal.created_at)}</p>
                {proposal.sent_at && <p>Отправлено: {fmtDate(proposal.sent_at)}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Клиент</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <Building2 size={14} className="text-gray-400" />
                  <span className="font-medium">{proposal.client_company}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={14} className="text-gray-400" />
                  <span>{proposal.client_contact}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={14} className="text-gray-400" />
                  <span>{proposal.client_email}</span>
                </div>
                {proposal.client_phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={14} className="text-gray-400" />
                    <span>{proposal.client_phone}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Детали</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={14} className="text-gray-400" />
                  <span>Менеджер: {proposal.manager.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Срок действия: {proposal.validity_days} дней</span>
                </div>
                {proposal.manager_signed_at && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <PenLine size={14} className="text-gray-400" />
                    <span>Подписано менеджером: {fmtDate(proposal.manager_signed_at)}</span>
                  </div>
                )}
                {proposal.head_signed_at && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <PenLine size={14} className="text-gray-400" />
                    <span>Подписано руководителем: {fmtDate(proposal.head_signed_at)}</span>
                  </div>
                )}
              </div>
            </div>
            {proposal.comment && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Комментарий</p>
                <p className="text-sm text-gray-700">{proposal.comment}</p>
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Состав КП</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                  <th className="text-left px-5 py-2.5 font-medium">Наименование</th>
                  <th className="text-right px-4 py-2.5 font-medium w-32">Цена</th>
                  <th className="text-center px-4 py-2.5 font-medium w-20">Кол.</th>
                  <th className="text-right px-4 py-2.5 font-medium w-36">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {proposal.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{item.product_name}</div>
                      {item.category_name && (
                        <div className="text-xs text-gray-400">{item.category_name} · {item.unit}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700 whitespace-nowrap">
                      {fmtMoney(item.price)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold whitespace-nowrap">
                      {fmtMoney(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Финансовый итог</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Итого без НДС</span>
                <span className="font-mono">{fmtMoney(proposal.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>НДС 12%</span>
                <span className="font-mono">{fmtMoney(proposal.vat_amount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Итого с НДС</span>
                <span className="font-mono">{fmtMoney(proposal.total)}</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">История статусов</h2>
            <div className="space-y-3">
              {proposal.history.map((h) => (
                <div key={h.id} className="flex gap-3">
                  <div className="mt-0.5">
                    <Clock size={14} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <StatusBadge status={h.status} />
                    <p className="text-xs text-gray-400 mt-1">{fmtDate(h.created_at)}</p>
                    {h.changed_by && (
                      <p className="text-xs text-gray-500">{h.changed_by.name}</p>
                    )}
                    {h.comment && (
                      <p className="text-xs text-red-600 mt-1 italic">«{h.comment}»</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
