import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ExternalLink } from 'lucide-react'
import api from '../api/client'
import { ProposalListItem, ProposalStatus } from '../api/types'
import { StatusBadge } from '../components/StatusBadge'
import { useAuthStore } from '../store/authStore'

function fmtMoney(n: number) {
  return n.toLocaleString('ru-KZ', { minimumFractionDigits: 0 }) + ' ₸'
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('ru-KZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: 'draft', label: 'Сформировано' },
  { value: 'on_approval', label: 'На согласовании' },
  { value: 'signed_head', label: 'Подписано руководителем' },
  { value: 'sent_client', label: 'Отправлено клиенту' },
  { value: 'rejected', label: 'Отклонено' },
]

export default function ProposalsListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [proposals, setProposals] = useState<ProposalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = () => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status_filter = statusFilter
    if (search) params.client = search
    api.get<ProposalListItem[]>('/proposals/', { params }).then((r) => {
      setProposals(r.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Реестр КП</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.role === 'manager' ? 'Ваши коммерческие предложения' : 'Все КП отдела'}
          </p>
        </div>
        {(user?.role === 'manager' || user?.role === 'admin') && (
          <button className="btn-primary" onClick={() => navigate('/catalog')}>
            <Plus size={16} /> Новое КП
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Поиск по клиенту..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">Найти</button>
        </form>
        <select
          className="input w-52"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Загрузка...</div>
        ) : proposals.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-lg mb-3">КП не найдено</p>
            {user?.role === 'manager' && (
              <button className="btn-primary" onClick={() => navigate('/catalog')}>
                <Plus size={16} /> Создать первое КП
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="text-left px-5 py-3 font-medium">Номер КП</th>
                <th className="text-left px-4 py-3 font-medium">Клиент</th>
                {user?.role !== 'manager' && (
                  <th className="text-left px-4 py-3 font-medium">Менеджер</th>
                )}
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-right px-4 py-3 font-medium">Сумма с НДС</th>
                <th className="text-center px-4 py-3 font-medium">Дата</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {proposals.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-brand-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/proposals/${p.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-brand-700 font-medium">{p.number}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-gray-900">{p.client_company}</div>
                    <div className="text-xs text-gray-400">{p.client_email}</div>
                  </td>
                  {user?.role !== 'manager' && (
                    <td className="px-4 py-3.5 text-gray-600">{p.manager.name}</td>
                  )}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-gray-900 whitespace-nowrap">
                    {fmtMoney(p.total)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-500 whitespace-nowrap">
                    {fmtDate(p.created_at)}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <ExternalLink size={14} className="text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 text-right">Всего: {proposals.length} КП</p>
    </div>
  )
}
