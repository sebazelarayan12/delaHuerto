import { useState } from 'react'
import { useNavigate } from 'react-router'
import LogoMark from '../shared/components/LogoMark'
import { useAuth } from '../shared/hooks/useAuth'



export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/admin')
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-[20px] p-9 w-full max-w-[400px] shadow-[0_8px_40px_rgba(44,18,8,0.12)]">
        <div className="text-center mb-7">
          <LogoMark size={48} />
          <div className="font-display text-[26px] font-extrabold text-espresso mt-3">
            Huerto Empanadas
          </div>
          <div className="text-[13px] text-muted mt-1">Panel de administración</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-username" className="text-xs font-bold uppercase tracking-[0.08em] text-brown">
              Usuario
            </label>
            <input
              id="login-username"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              autoComplete="username"
              className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-ivory outline-none focus:border-terra"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-[0.08em] text-brown">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              autoComplete="current-password"
              className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-ivory outline-none focus:border-terra"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 rounded-lg px-3 py-2 text-[13px] font-semibold flex items-center gap-1.5">
              <span className="icon text-base">error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center gap-1.5 p-[13px] rounded-xl font-sans text-[15px] font-semibold border-none mt-1 shadow-[0_2px_8px_rgba(196,82,42,0.3)] transition-colors duration-150 ${loading ? 'bg-sand-deep text-white cursor-not-allowed' : 'bg-terra text-white cursor-pointer hover:bg-terra-dark'}`}
          >
            <span className="icon icon-fill text-[18px]">lock_open</span>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
