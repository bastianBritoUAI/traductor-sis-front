import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 pt-16 text-slate-900 dark:bg-[#07101d] dark:text-slate-100">
      <AppHeader />
      <Outlet />
    </div>
  )
}
