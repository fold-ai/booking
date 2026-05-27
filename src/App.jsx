import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'

// Public pages — eager (fast first paint + SEO).
import Landing from './pages/Landing.jsx'
import Discover from './pages/Discover.jsx'
import BusinessProfile from './pages/BusinessProfile.jsx'
import PublicBooking from './pages/PublicBooking.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import NotFound from './pages/NotFound.jsx'
import FieldServiceSchedulingSoftware from './pages/seo/FieldServiceSchedulingSoftware.jsx'
import BookingSoftwareForSmallCrews from './pages/seo/BookingSoftwareForSmallCrews.jsx'
import SchedulingAppForFieldServiceTeams from './pages/seo/SchedulingAppForFieldServiceTeams.jsx'
import { Privacy, Terms } from './pages/Legal.jsx'

// Authenticated app — lazy (keeps react-big-calendar + dashboard out of the
// initial/public bundle).
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Calendar = lazy(() => import('./pages/Calendar.jsx'))
const Bookings = lazy(() => import('./pages/Bookings.jsx'))
const Workers = lazy(() => import('./pages/Workers.jsx'))
const Clients = lazy(() => import('./pages/Clients.jsx'))
const ClientDetail = lazy(() => import('./pages/ClientDetail.jsx'))
const Services = lazy(() => import('./pages/Services.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Inbox = lazy(() => import('./pages/Inbox.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const JoinPage = lazy(() => import('./pages/JoinPage.jsx'))

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  return children
}

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-ink-700" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Discover />} />
        <Route path="/for-business" element={<Landing />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/field-service-scheduling-software" element={<FieldServiceSchedulingSoftware />} />
        <Route path="/booking-software-for-small-crews" element={<BookingSoftwareForSmallCrews />} />
        <Route path="/scheduling-app-for-field-service-teams" element={<SchedulingAppForFieldServiceTeams />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/book/:slug" element={<PublicBooking />} />
        <Route path="/biz/:slug" element={<BusinessProfile />} />
        <Route path="/join/:token" element={<JoinPage />} />

        {/* Authenticated */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/calendar" element={<Calendar />} />
          <Route path="/app/bookings" element={<Bookings />} />
          <Route path="/app/workers" element={<Workers />} />
          <Route path="/app/clients" element={<Clients />} />
          <Route path="/app/clients/:id" element={<ClientDetail />} />
          <Route path="/app/services" element={<Services />} />
          <Route path="/app/inbox" element={<Inbox />} />
          <Route path="/app/profile" element={<Profile />} />
          <Route path="/app/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
