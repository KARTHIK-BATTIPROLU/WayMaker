import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="glass-card p-8 max-w-md text-center">
            <div className="text-red-400 text-4xl mb-4">⚠</div>
            <h2 className="text-white text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-zinc-400 text-sm mb-6">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-teal-500 hover:bg-teal-400 text-black font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
