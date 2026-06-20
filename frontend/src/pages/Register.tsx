import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { registerSchema } from '../lib/schemas'
import type { z } from 'zod'
import api from '../lib/api'
import { useAuthStore } from '../store/auth'
import { useState } from 'react'

type RegisterForm = z.infer<typeof registerSchema>

const perks = ['Market research in 2 minutes', 'AI landing page generator', 'Funding opportunity matching', 'Free forever to try']

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCp, setShowCp] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('')
      const res = await api.post('/api/auth/register', data)
      setAuth(res.data.user, res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to create account') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg relative overflow-hidden py-8">
      <div className="blob w-[500px] h-[500px] top-1/4 right-1/4" style={{ background: 'rgba(129,140,248,0.1)' }} />
      <div className="blob w-[400px] h-[400px] bottom-1/4 left-1/4" style={{ background: 'rgba(45,212,191,0.1)', animationDelay: '-6s' }} />

      <div className="w-full max-w-sm mx-4 z-10 animate-scale-in">
        <div className="grad-border p-[1px] rounded-2xl">
          <div className="rounded-2xl p-8" style={{ background: '#09090f' }}>
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                style={{ background: 'linear-gradient(135deg,#2dd4bf,#818cf8)' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-white text-xl font-bold font-display">Create your account</h1>
              <p className="text-zinc-600 text-sm mt-1">Start building your startup</p>
            </div>

            {/* Perks */}
            <div className="mb-6 grid grid-cols-2 gap-1.5">
              {perks.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-teal-500 shrink-0" />
                  <span className="text-zinc-600 text-xs">{p}</span>
                </div>
              ))}
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
                  <input type={showPw ? 'text' : 'password'} {...register('password')} placeholder="Min 8 characters"
                    autoComplete="new-password" className="input-base" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#52525b' }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showCp ? 'text' : 'password'} {...register('confirmPassword')} placeholder="Repeat password"
                    autoComplete="new-password" className="input-base" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowCp(!showCp)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#52525b' }}>
                    {showCp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
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
                {isSubmitting ? 'Creating account…' : 'Create Free Account'}
              </button>
            </form>

            <p className="text-center mt-5 text-zinc-600 text-sm">
              Have an account?{' '}
              <Link to="/login" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
