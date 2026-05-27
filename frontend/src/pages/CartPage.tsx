import { useNavigate } from 'react-router-dom'
import { Trash2, ArrowLeft, FileText, Minus, Plus } from 'lucide-react'
import { useCartStore } from '../store/cartStore'

function fmtMoney(n: number) {
  return n.toLocaleString('ru-KZ', { minimumFractionDigits: 2 }) + ' ₸'
}

export default function CartPage() {
  const navigate = useNavigate()
  const { items, setQty, remove, clear, subtotal, vat, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/catalog')} className="btn-secondary">
          <ArrowLeft size={16} /> Назад в каталог
        </button>
        <div className="card p-16 text-center">
          <p className="text-gray-400 text-lg mb-4">Корзина пуста</p>
          <button onClick={() => navigate('/catalog')} className="btn-primary">
            Перейти в каталог
          </button>
        </div>
      </div>
    )
  }

  // Group by category
  const grouped: Record<string, typeof items> = {}
  items.forEach((item) => {
    const cat = item.product.unit // just group by category via product data
    const catName = 'Выбранные услуги'
    if (!grouped[catName]) grouped[catName] = []
    grouped[catName].push(item)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/catalog')} className="btn-secondary">
          <ArrowLeft size={16} /> Назад в каталог
        </button>
        <button onClick={clear} className="btn-secondary text-red-600">
          <Trash2 size={16} /> Очистить
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Корзина</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-2">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Наименование</th>
                  <th className="text-right px-4 py-3 font-medium w-32">Цена</th>
                  <th className="text-center px-4 py-3 font-medium w-32">Кол-во</th>
                  <th className="text-right px-4 py-3 font-medium w-36">Сумма</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.product.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{item.product.name}</div>
                      <div className="text-xs text-gray-400">{item.product.unit}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700 whitespace-nowrap">
                      {fmtMoney(item.product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => item.quantity === 1 ? remove(item.product.id) : setQty(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => setQty(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center hover:bg-brand-800"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold whitespace-nowrap">
                      {fmtMoney(item.product.price * item.quantity)}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => remove(item.product.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
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

            <button
              className="btn-primary w-full justify-center"
              onClick={() => navigate('/proposals/new')}
            >
              <FileText size={16} />
              Оформить КП
            </button>
          </div>

          <div className="text-xs text-gray-400 text-center">
            {items.length} позиций в корзине
          </div>
        </div>
      </div>
    </div>
  )
}
