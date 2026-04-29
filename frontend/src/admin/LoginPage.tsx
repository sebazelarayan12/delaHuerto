import { useState, useReducer } from 'react'
import { useNavigate } from 'react-router'
import LogoMark from '../shared/components/LogoMark'
import { useAuth } from '../shared/hooks/useAuth'

type LoginState = {
  username: string
  password: string
  error: string
  loading: boolean
}

type LoginAction =
  | { type: 'set_username'; value: string }
  | { type: 'set_password'; value: string }
  | { type: 'set_error'; value: string }
  | { type: 'set_loading'; value: boolean }

function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case 'set_username': return { ...state, username: action.value, error: '' }
    case 'set_password': return { ...state, password: action.value, error: '' }
    case 'set_error': return { ...state, error: action.value, loading: false }
    case 'set_loading': return { ...state, loading: action.value }
  }
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [state, dispatch] = useReducer(loginReducer, {
    username: '',
    password: '',
    error: '',
    loading: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'set_loading', value: true })
    try {
      await login(state.username, state.password)
      navigate('/admin')
    } catch {
      dispatch({ type: 'set_error', value: 'Usuario o contrasena incorrectos' })
    } finally {
      dispatch({ type: 'set_loading', value: false })
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
          <div className="text-[13px] text-muted mt-1">Panel de administracion</div>
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
              value={state.username}
              onChange={(e) => dispatch({ type: 'set_username', value: e.target.value })}
              autoComplete="username"
              className="w-full px-[13px] py-2.5 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-ivory outline-none focus:border-terra"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-[0.08em] text-brown">
              Contrasena
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={state.password}
                onChange={(e) => dispatch({ type: 'set_password', value: e.target.value })}
                autoComplete="current-password"
                className="w-full px-[13px] py-2.5 pr-10 border-[1.5px] border-sand-deep rounded-[10px] font-sans text-sm text-espresso bg-ivory outline-none focus:border-terra"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted p-1 flex items-center justify-center"
              >
                <span className="icon text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {state.error && (
            <div className="bg-red-50 text-red-600 rounded-lg px-3 py-2 text-[13px] font-semibold flex items-center gap-1.5">
              <span className="icon text-base">error</span>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={state.loading}
            className={`inline-flex items-center justify-center gap-1.5 p-[13px] rounded-xl font-sans text-[15px] font-semibold border-none mt-1 shadow-[0_2px_8px_rgba(196,82,42,0.3)] transition-colors duration-150 ${state.loading ? 'bg-sand-deep text-white cursor-not-allowed' : 'bg-terra text-white cursor-pointer hover:bg-terra-dark'}`}
          >
            <span className="icon icon-fill text-[18px]">lock_open</span>
            {state.loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
