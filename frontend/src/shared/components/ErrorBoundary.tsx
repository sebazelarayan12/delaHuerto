import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <div
            className="flex items-center justify-center mb-2"
            style={{ width: 72, height: 72, borderRadius: '50%', background: '#F3E8D8' }}
          >
            <span className="icon" style={{ fontSize: 38, color: '#9A7A66' }}>error_outline</span>
          </div>
          <p className="font-display text-[22px] font-bold text-espresso">Ocurrio un error</p>
          <p className="text-sm text-muted max-w-[320px]">
            Algo salio mal al cargar esta seccion. Intenta recargar la pagina.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-terra text-white px-5 py-2.5 rounded-[12px] border-none font-sans text-sm font-bold cursor-pointer hover:bg-terra-dark transition-colors"
            style={{ boxShadow: '0 3px 12px rgba(196,82,42,0.3)' }}
          >
            <span className="icon" style={{ fontSize: 18 }}>refresh</span>
            Recargar pagina
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
