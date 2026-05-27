import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { LayoutGrid, FileText, Settings, LogOut, ShoppingCart } from 'lucide-react'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const cartCount = useCartStore((s) => s.items.length)
  const location = useLocation()
  const navigate = useNavigate()

  const nav = [
    { to: '/catalog',   label: 'Каталог',   icon: LayoutGrid, roles: ['manager', 'head', 'admin'] },
    { to: '/proposals', label: 'Реестр КП', icon: FileText,   roles: ['manager', 'head', 'admin'] },
    { to: '/admin',     label: 'Управление прайсом', icon: Settings, roles: ['admin'] },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-brand-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/catalog" className="font-bold text-lg tracking-tight">
              ЦОД&nbsp;<span className="text-brand-300">КП</span>
            </Link>
            <nav className="flex gap-1">
              {nav
                .filter((n) => user && n.roles.includes(user.role))
                .map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      location.pathname.startsWith(n.to)
                        ? 'bg-brand-700 text-white'
                        : 'text-brand-200 hover:bg-brand-700 hover:text-white'
                    }`}
                  >
                    <n.icon size={15} />
                    {n.label}
                  </Link>
                ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Cart button (only managers) */}
            {(user?.role === 'manager' || user?.role === 'admin') && (
              <Link
                to="/cart"
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/cart'
                    ? 'bg-brand-700 text-white'
                    : 'text-brand-200 hover:bg-brand-700 hover:text-white'
                }`}
              >
                <ShoppingCart size={15} />
                Корзина
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            <div className="text-sm text-brand-200 flex items-center gap-2">
              <span className="hidden sm:block">{user?.name}</span>
              <span className="text-xs bg-brand-700 px-2 py-0.5 rounded">
                {user?.role === 'manager' ? 'Менеджер' : user?.role === 'head' ? 'Руководитель' : 'Администратор'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-brand-200 hover:text-white transition-colors"
              title="Выйти"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-gray-200 py-3 text-center text-xs text-gray-400">
        ЦОД — Система управления коммерческими предложениями © 2025
      </footer>
    </div>
  )
}
