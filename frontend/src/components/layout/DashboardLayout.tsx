import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import FloatingChatbot from '../chat/FloatingChatbot'

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0 relative">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
      <FloatingChatbot />
    </div>
  )
}
