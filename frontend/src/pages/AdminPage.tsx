import { useEffect, useState } from 'react'
import { Plus, Pencil, Archive, Check, X } from 'lucide-react'
import api from '../api/client'
import { Category, Product } from '../api/types'

function fmtMoney(n: number) {
  return n.toLocaleString('ru-KZ', { minimumFractionDigits: 0 }) + ' ₸'
}

interface EditingProduct {
  id: number | null
  category_id: number
  name: string
  description: string
  price: string
  unit: string
}

const EMPTY: EditingProduct = {
  id: null, category_id: 0, name: '', description: '', price: '', unit: '',
}

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditingProduct | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  const load = () => {
    api.get<Category[]>('/admin/categories').then((r) => {
      setCategories(r.data)
      if (!activeCategory && r.data.length > 0) setActiveCategory(r.data[0].id)
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const currentCat = categories.find((c) => c.id === activeCategory)

  const startNew = () => {
    setEditing({ ...EMPTY, category_id: activeCategory ?? categories[0]?.id ?? 0 })
    setError('')
  }

  const startEdit = (p: Product) => {
    setEditing({
      id: p.id,
      category_id: p.category_id,
      name: p.name,
      description: p.description ?? '',
      price: String(p.price),
      unit: p.unit,
    })
    setError('')
  }

  const cancelEdit = () => setEditing(null)

  const save = async () => {
    if (!editing) return
    if (!editing.name || !editing.price || !editing.unit) {
      setError('Заполните обязательные поля: название, цена, единица измерения')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        category_id: editing.category_id,
        name: editing.name,
        description: editing.description || undefined,
        price: parseFloat(editing.price),
        unit: editing.unit,
      }
      if (editing.id) {
        await api.patch(`/admin/products/${editing.id}`, body)
      } else {
        await api.post('/admin/products', body)
      }
      setEditing(null)
      load()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const archive = async (id: number) => {
    if (!confirm('Архивировать продукт? Он исчезнет из каталога для менеджеров.')) return
    await api.delete(`/admin/products/${id}`)
    load()
  }

  if (loading) return <div className="py-16 text-center text-gray-400">Загрузка...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление прайс-листом</h1>
          <p className="text-sm text-gray-500 mt-0.5">Добавляйте, редактируйте и архивируйте позиции</p>
        </div>
        <button className="btn-primary" onClick={startNew}>
          <Plus size={16} /> Новая позиция
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card p-5 border-brand-200 bg-brand-50 space-y-4">
          <h2 className="font-semibold text-gray-900">
            {editing.id ? 'Редактирование позиции' : 'Новая позиция'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Раздел каталога *</label>
              <select className="input" value={editing.category_id}
                onChange={(e) => setEditing({ ...editing, category_id: Number(e.target.value) })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Наименование *</label>
              <input className="input" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Аренда стойки 42U" />
            </div>
            <div>
              <label className="label">Цена без НДС (₸) *</label>
              <input className="input" type="number" min="0" value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                placeholder="180000" />
            </div>
            <div>
              <label className="label">Единица измерения *</label>
              <input className="input" value={editing.unit}
                onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                placeholder="стойка/мес" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Описание / характеристики</label>
              <input className="input" value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Краткое описание услуги..." />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary" onClick={save} disabled={saving}>
              <Check size={15} /> {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button className="btn-secondary" onClick={cancelEdit}>
              <X size={15} /> Отмена
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Category tabs */}
        <div className="card p-2 h-fit">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">Разделы</p>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeCategory === cat.id
                  ? 'bg-brand-700 text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div>{cat.name}</div>
              <div className={`text-xs ${activeCategory === cat.id ? 'text-brand-200' : 'text-gray-400'}`}>
                {cat.products.length} позиций
              </div>
            </button>
          ))}
        </div>

        {/* Products table */}
        <div className="lg:col-span-3 card overflow-hidden">
          {currentCat ? (
            <>
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{currentCat.name}</h2>
                <span className="text-sm text-gray-500">{currentCat.products.length} позиций</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                    <th className="text-left px-5 py-2.5 font-medium">Наименование</th>
                    <th className="text-right px-4 py-2.5 font-medium w-36">Цена без НДС</th>
                    <th className="text-center px-4 py-2.5 font-medium w-28">Ед. изм.</th>
                    <th className="text-center px-4 py-2.5 font-medium w-24">Статус</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentCat.products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400">
                        Нет позиций в этом разделе
                      </td>
                    </tr>
                  ) : (
                    currentCat.products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">{p.name}</div>
                          {p.description && (
                            <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-800 whitespace-nowrap">
                          {fmtMoney(p.price)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">{p.unit}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {p.is_active ? 'Активен' : 'Архив'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={() => startEdit(p)}
                              className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Редактировать"
                            >
                              <Pencil size={14} />
                            </button>
                            {p.is_active && (
                              <button
                                onClick={() => archive(p.id)}
                                className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                                title="Архивировать"
                              >
                                <Archive size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <div className="py-16 text-center text-gray-400">Выберите раздел</div>
          )}
        </div>
      </div>
    </div>
  )
}
