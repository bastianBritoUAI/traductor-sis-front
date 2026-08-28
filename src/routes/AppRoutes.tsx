import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from '../auth/AuthGuard'
import { LoadingScreen } from '../components/LoadingScreen'
import { AppLayout } from '../layouts/AppLayout'

const SwaggerExplorer = lazy(() =>
  import('../features/swagger/components/SwaggerExplorer').then((module) => ({
    default: module.SwaggerExplorer,
  })),
)

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/explorer" element={<SwaggerExplorer />} />
          <Route index element={<Navigate to="/explorer" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/explorer" replace />} />
      </Routes>
    </Suspense>
  )
}
