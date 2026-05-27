import { ProposalStatus } from '../api/types'

const CONFIG: Record<ProposalStatus, { label: string; cls: string }> = {
  draft:          { label: 'Сформировано',              cls: 'bg-gray-100 text-gray-700' },
  signed_manager: { label: 'Подписано менеджером',      cls: 'bg-blue-100 text-blue-700' },
  on_approval:    { label: 'На согласовании',           cls: 'bg-yellow-100 text-yellow-700' },
  signed_head:    { label: 'Подписано руководителем',   cls: 'bg-green-100 text-green-700' },
  sent_client:    { label: 'Отправлено клиенту',        cls: 'bg-emerald-100 text-emerald-700' },
  rejected:       { label: 'Отклонено',                 cls: 'bg-red-100 text-red-700' },
}

export function StatusBadge({ status }: { status: ProposalStatus }) {
  const { label, cls } = CONFIG[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
