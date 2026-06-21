import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MyProjects from './pages/MyProjects'
import DashboardLayout from './components/layout/DashboardLayout'
import MarketResearch from './pages/modules/MarketResearch'
import CompetitorAnalysis from './pages/modules/CompetitorAnalysis'
import CustomerValidation from './pages/modules/CustomerValidation'
import WebsiteBuilder from './pages/modules/WebsiteBuilder'
import FundingMatcher from './pages/modules/FundingMatcher'
import Deployments from './pages/modules/Deployments'
import MarketingKitHome from './features/marketingKit/MarketingKitHome'
import OwnIdeaFlow from './features/marketingKit/ownIdea/OwnIdeaFlow'
import CalendarView from './features/marketingKit/calendar/CalendarView'
import PreviewPanel from './features/marketingKit/preview/PreviewPanel'
import PlatformPreview from './features/marketingKit/preview/PlatformPreview'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (!accessToken) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
          >
            <Route index element={<Dashboard />} />
            <Route path="research" element={<MarketResearch />} />
            <Route path="competitors" element={<CompetitorAnalysis />} />
            <Route path="customer-validation" element={<CustomerValidation />} />
            <Route path="website" element={<WebsiteBuilder />} />
            <Route path="marketing-kit" element={<MarketingKitHome />}>
              <Route path="own-idea" element={<OwnIdeaFlow />} />
              <Route path="calendar" element={<CalendarView />} />
            </Route>
            <Route path="marketing-kit/preview/:sessionId" element={<PreviewPanel />} />
            <Route path="marketing-kit/platform/:sessionId" element={<PlatformPreview />} />
            <Route path="funding" element={<FundingMatcher />} />
            <Route path="deployments" element={<Deployments />} />
            <Route path="projects" element={<MyProjects />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
