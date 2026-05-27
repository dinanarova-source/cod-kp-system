import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, ShoppingCart, Search, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../api/client'
import { Category } from '../api/types'
import { useCartStore } from '../store/cartStore'

function fmtMoney(n: number) {
  return n.toLocaleString('ru-KZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₸'
}

export default function CatalogPage() {
  const [catalog, setCatalog] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})
  const { items, add, setQty, remove } = useCartStore()
  const navigate = useNavigate()

  useEffect(() => {
    api.get<Category[]>('/catalog/').then((r) => {
      setCatalog(r.data)
      setLoading(false)
    })
  }, [])

  const getQty = (productId: number) =>
    items.find((i) => i.product.id === productId)?.quantity ?? 0

  const toggleCategory = (id: number) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))

  const filtered = catalog.map((cat) => ({
    ...cat,
    products: cat.products.filter(
      (p) =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.products.length > 0)

  const totalItems = items.length

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Загрузка каталога...</div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Каталог услуг ЦОД</h1>
          <p className="text-sm text-gray-500 mt-0.5">Выберите услуги для формирования КП</p>
        </div>
        {totalItems > 0 && (
          <button
            className="btn-primary"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={16} />
            Корзина ({totalItems} поз.)
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Поиск по каталогу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Categories */}
      {filtered.map((cat) => (
        <div key={cat.id} className="card overflow-hidden">
          {/* Category header */}
          <button
            className="w-full flex items-center justify-between px-5 py-3.5 bg-brand-50 hover:bg-brand-100 transition-colors text-left"
            onClick={() => toggleCategory(cat.id)}
          >
            <span className="font-semibold text-brand-800">{cat.name}</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{cat.products.length} позиций</span>
              {collapsed[cat.id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
          </button>

          {/* Products */}
          {!collapsed[cat.id] && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-2.5 font-medium">Наименование</th>
                  <th className="text-right px-4 py-2.5 font-medium w-36">Цена без НДС</th>
                  <th className="text-center px-4 py-2.5 font-medium w-24">Ед.</th>
                  <th className="text-center px-4 py-2.5 font-medium w-40">Количество</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cat.products.map((p) => {
                  const qty = getQty(p.id)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-800 whitespace-nowrap">
                        {fmtMoney(p.price)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">
                        {p.unit}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {qty === 0 ? (
                            <button
                              onClick={() => add(p)}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
                              <Plus size={13} /> Добавить
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => qty === 1 ? remove(p.id) : setQty(p.id, qty - 1)}
                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center font-semibold text-gray-900">{qty}</span>
                              <button
                                onClick={() => setQty(p.id, qty + 1)}
                                className="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center hover:bg-brand-800 transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">Ничего не найдено</div>
      )}
    </div>
  )
}
