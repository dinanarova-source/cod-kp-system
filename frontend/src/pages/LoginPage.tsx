import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { TokenResponse } from '../api/types'
import { Lock } from 'lucide-react'

interface FormData {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const res = await api.post<TokenResponse>('/auth/login', data)
      login(res.data.access_token, res.data.user)
      navigate('/catalog')
    } catch {
      setError('Неверный email или пароль')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-800 to-brand-900 p-4">
      <div className="card p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-700 flex items-center justify-center mb-3">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Вход в систему</h1>
          <p className="text-sm text-gray-500 mt-1">ЦОД — Управление КП</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              {...register('email', { required: true })}
              type="email"
              className="input"
              placeholder="manager@cod.kz"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input
              {...register('password', { required: true })}
              type="password"
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-400 space-y-0.5">
          <p className="font-medium text-gray-500 mb-1">Тестовые аккаунты:</p>
          <p>manager@cod.kz / manager123</p>
          <p>head@cod.kz / head123</p>
          <p>admin@cod.kz / admin123</p>
        </div>
      </div>
    </div>
  )
}
