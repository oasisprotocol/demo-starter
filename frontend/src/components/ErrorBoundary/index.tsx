import { Component, PropsWithChildren } from 'react'
import { ErrorBoundaryLayout } from '../ErrorBoundaryLayout'

interface Props {
  hasError: boolean
  error?: unknown
}

export class ErrorBoundary extends Component<PropsWithChildren, Props> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: unknown) {
    console.error(error)
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryLayout error={this.state.error} />
    }

    return this.props.children
  }
}
