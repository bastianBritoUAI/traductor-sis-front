import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {}

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado en la interfaz', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-[#07101d]">
          <div className="max-w-lg rounded-2xl border border-rose-500/20 bg-white p-8 text-center shadow-xl dark:bg-[#0c1726]">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Algo salió mal</h1>
            <p className="mt-2 text-sm text-slate-500">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950"
            >
              Recargar aplicación
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
