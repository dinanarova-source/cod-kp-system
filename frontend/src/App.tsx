import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/Layout'
import LoginPage from './pages/LoginPage'
import CatalogPage from './pages/CatalogPage'
import CartPage from './pages/CartPage'
import ProposalFormPage from './pages/ProposalFormPage'
import ProposalsListPage from './pages/ProposalsListPage'
import ProposalDetailPage from './pages/ProposalDetailPage'
import AdminPage from './pages/AdminPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user?.role !== 'admin') return <Navigate to="/proposals" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <RequireAuth>
            <Layout><CatalogPage /></Layout>
          </RequireAuth>
        } />

        <Route path="/catalog" element={
          <RequireAuth>
            <Layout><CatalogPage /></Layout>
          </RequireAuth>
        } />

        <Route path="/cart" element={
          <RequireAuth>
            <Layout><CartPage /></Layout>
          </RequireAuth>
        } />

        <Route path="/proposals/new" element={
          <RequireAuth>
            <Layout><ProposalFormPage /></Layout>
          </RequireAuth>
        } />

        <Route path="/proposals" element={
          <RequireAuth>
            <Layout><ProposalsListPage /></Layout>
          </RequireAuth>
        } />

        <Route path="/proposals/:id" element={
          <RequireAuth>
            <Layout><ProposalDetailPage /></Layout>
          </RequireAuth>
        } />

        <Route path="/admin" element={
          <RequireAuth>
            <RequireAdmin>
              <Layout><AdminPage /></Layout>
            </RequireAdmin>
          </RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
