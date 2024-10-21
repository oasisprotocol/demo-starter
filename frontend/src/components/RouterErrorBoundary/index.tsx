import { useRouteError } from 'react-router-dom'
import { ErrorBoundaryLayout } from '../ErrorBoundaryLayout'

export const RouterErrorBoundary = () => {
  const error = useRouteError()

  return <ErrorBoundaryLayout error={error} />
}
