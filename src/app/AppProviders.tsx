import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'
import { queryClient } from './queryClient'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className:
              '!rounded-xl !border !border-slate-200 !bg-white !text-sm !text-slate-800 !shadow-xl dark:!border-white/10 dark:!bg-[#111e2e] dark:!text-slate-100',
            duration: 4000,
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
