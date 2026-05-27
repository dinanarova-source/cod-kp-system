import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, FileText, Minus, Plus, Trash2 } from 'lucide-react'
import api from '../api/client'
import { Proposal } from '../api/types'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

interface FormData {
  client_company: string
  client_contact: string
  client_email: string
  client_phone: string
  validity_days: string
  comment: string
}

function fmtMoney(n: number) {
  return n.toLocaleString('ru-KZ', { minimumFractionDigits: 2 }) + ' ₸'
}

export default function ProposalFormPage() {
  const navigate = useNavigate()
  const { items, setQty, remove, subtotal, vat, total } = useCartStore()
  const { user } = useAuthStore()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    defaultValues: { validity_days: '30' },
  })

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/catalog')} className="btn-secondary">
          <ArrowLeft size={16} /> В каталог
        </button>
        <div className="card p-16 text-center">
          <p className="text-gray-400 text-lg mb-4">Корзина пуста — нечего оформлять</p>
          <button onClick={() => navigate('/catalog')} className="btn-primary">Перейти в каталог</button>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const res = await api.post<Proposal>('/proposals/', {
        ...data,
        validity_days: Number(data.validity_days),
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      })
      useCartStore.getState().clear()
      navigate(`/proposals/${res.data.id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Ошибка при создании КП')
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/cart')} className="btn-secondary">
        <ArrowLeft size={16} /> Назад в корзину
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Оформление коммерческого предложения</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — client form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 text-lg">Данные клиента</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Наименование компании *</label>
                  <input {...register('client_company', { required: 'Обязательное поле' })}
                    className="input" placeholder="ТОО «Компания»" />
                  {errors.client_company && <p className="text-xs text-red-500 mt-1">{errors.client_company.message}</p>}
                </div>
                <div>
                  <label className="label">Контактное лицо *</label>
                  <input {...register('client_contact', { required: 'Обязательное поле' })}
                    className="input" placeholder="Иванов Иван Иванович" />
                  {errors.client_contact && <p className="text-xs text-red-500 mt-1">{errors.client_contact.message}</p>}
                </div>
                <div>
                  <label className="label">Email клиента *</label>
                  <input {...register('client_email', {
                    required: 'Обязательное поле',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Некорректный email' }
                  })} className="input" type="email" placeholder="client@company.kz" />
                  {errors.client_email && <p className="text-xs text-red-500 mt-1">{errors.client_email.message}</p>}
                </div>
                <div>
                  <label className="label">Телефон</label>
                  <input {...register('client_phone')} className="input" placeholder="+7 (777) 123-45-67" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Менеджер</label>
                  <input value={user?.name ?? ''} disabled className="input bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <label className="label">Срок действия КП</label>
                  <select {...register('validity_days')} className="input">
                    <option value="14">14 дней</option>
                    <option value="30">30 дней</option>
                    <option value="45">45 дней</option>
                    <option value="60">60 дней</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Дополнительные условия / комментарий</label>
                <textarea {...register('comment')} className="input h-24 resize-none"
                  placeholder="Особые условия, скидки, примечания..." />
              </div>
            </div>

            {/* Items preview */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Состав КП</h2>
                <span className="text-sm text-gray-500">{items.length} позиций</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                    <th className="text-left px-5 py-2.5 font-medium">Наименование</th>
                    <th className="text-right px-4 py-2.5 font-medium w-32">Цена</th>
                    <th className="text-center px-4 py-2.5 font-medium w-32">Кол-во</th>
                    <th className="text-right px-4 py-2.5 font-medium w-36">Сумма</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.product.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-xs text-gray-400">{item.product.unit}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-700 whitespace-nowrap">
                        {fmtMoney(item.product.price)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button"
                            onClick={() => item.quantity === 1 ? remove(item.product.id) : setQty(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                            <Minus size={11} />
                          </button>
                          <span className="w-7 text-center font-semibold">{item.quantity}</span>
                          <button type="button"
                            onClick={() => setQty(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-brand-700 text-white flex items-center justify-center hover:bg-brand-800">
                            <Plus size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold whitespace-nowrap">
                        {fmtMoney(item.product.price * item.quantity)}
                      </td>
                      <td className="px-2">
                        <button type="button" onClick={() => remove(item.product.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right — summary & submit */}
          <div className="space-y-4">
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-gray-900">Итог</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Итого без НДС</span>
                  <span className="font-mono">{fmtMoney(subtotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>НДС 12%</span>
                  <span className="font-mono">{fmtMoney(vat())}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Итого с НДС</span>
                  <span className="font-mono">{fmtMoney(total())}</span>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <button type="submit" className="btn-primary w-full justify-center" disabled={isSubmitting}>
                <FileText size={16} />
                {isSubmitting ? 'Создаём КП...' : 'Создать КП'}
              </button>
            </div>

            <div className="card p-4 text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">После создания КП:</p>
              <p>1. Подпишите своей ЭЦП</p>
              <p>2. КП уйдёт на согласование руководителю</p>
              <p>3. После подписи — отправьте клиенту</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
