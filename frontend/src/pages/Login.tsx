import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import { loginSchema } from '../lib/schemas'
import type { z } from 'zod'
import api from '../lib/api'
import { useAuthStore } from '../store/auth'
import { useState } from 'react'

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('')
      const res = await api.post('/api/auth/login', data)
      setAuth(res.data.user, res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) { setError(err.response?.data?.detail || 'Invalid email or password') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg relative overflow-hidden">
      <div className="blob w-[500px] h-[500px] top-1/4 left-1/4" style={{ background: 'rgba(45,212,191,0.12)' }} />
      <div className="blob w-[400px] h-[400px] bottom-1/4 right-1/4" style={{ background: 'rgba(129,140,248,0.1)', animationDelay: '-4s' }} />

      <div className="w-full max-w-sm mx-4 z-10 animate-scale-in">
        <div className="grad-border p-[1px] rounded-2xl">
          <div className="rounded-2xl p-8" style={{ background: '#09090f' }}>
            {/* Logo */}
            <div className="flex flex-col items-center mb-7">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                style={{ background: 'linear-gradient(135deg,#2dd4bf,#818cf8)' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-white text-xl font-bold font-display">Welcome back</h1>
              <p className="text-zinc-600 text-sm mt-1">Sign in to Waymaker</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Email</label>
                <input type="email" {...register('email')} placeholder="you@example.com"
                  autoComplete="email" className="input-base" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} {...register('password')} placeholder="••••••••"
                    autoComplete="current-password" className="input-base" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#52525b' }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="p-3 rounded-xl text-xs text-center"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={isSubmitting}
                className="btn-gradient w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                {isSubmitting && <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center mt-5 text-zinc-600 text-sm">
              No account?{' '}
              <Link to="/register" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                Create one free →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
