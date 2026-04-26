import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../shared/hooks/useAuth'

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#C4522A" />
      <path d="M8 22 Q12 10 18 14 Q24 18 28 10" stroke="#FBF1D8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="18" cy="22" rx="8" ry="5" fill="#E8A838" opacity="0.9" />
      <path d="M10 22 Q14 28 18 27 Q22 28 26 22" stroke="#C4522A" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

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
    <div
      style={{
        minHeight: '100vh',
        background: '#FDF6EC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          padding: 36,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 40px rgba(44,18,8,0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <LogoMark size={48} />
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 800,
              color: '#2C1208',
              marginTop: 12,
            }}
          >
            Huerto Empanadas
          </div>
          <div style={{ fontSize: 13, color: '#9A7A66', marginTop: 4 }}>Panel de administración</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A4020' }}>
              Usuario
            </label>
            <input
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              autoComplete="username"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A4020' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                borderRadius: 8,
                padding: '9px 13px',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <span className="icon" style={{ fontSize: 16 }}>error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 13,
              borderRadius: 12,
              background: loading ? '#E2CFB5' : '#C4522A',
              color: 'white',
              border: 'none',
              fontFamily: "'Manrope', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              boxShadow: '0 2px 8px rgba(196,82,42,0.3)',
              transition: 'background 0.15s',
            }}
          >
            <span className="icon icon-fill" style={{ fontSize: 18 }}>lock_open</span>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 13px',
  border: '1.5px solid #E2CFB5',
  borderRadius: 10,
  fontFamily: "'Manrope', sans-serif",
  fontSize: 14,
  color: '#2C1208',
  background: '#FDF6EC',
  outline: 'none',
  width: '100%',
}
