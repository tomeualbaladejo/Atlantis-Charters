import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LanguageProvider } from './contexts/LanguageContext'
import { BookingProvider, useBooking } from './contexts/BookingContext'
import BookingWidget from './components/BookingWidget'
import Home        from './pages/Home'
import Experiencia from './pages/Experiencia'
import Destinos    from './pages/Destinos'
import Nosotros    from './pages/Nosotros'
import Admin       from './pages/Admin'

function AppRoutes() {
  const location = useLocation()
  const { bookingOpen, initialSession, closeBooking } = useBooking()

  return (
    <>
      <BookingWidget
        isOpen={bookingOpen}
        onClose={closeBooking}
        initialSession={initialSession}
      />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"            element={<Home />} />
          <Route path="/experiencia" element={<Experiencia />} />
          <Route path="/destinos"    element={<Destinos />} />
          <Route path="/nosotros"    element={<Nosotros />} />
          <Route path="/admin"       element={<Admin />} />
          {/* backward-compat redirect */}
          <Route path="/places"      element={<Navigate to="/destinos" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <BookingProvider>
        <AppRoutes />
      </BookingProvider>
    </LanguageProvider>
  )
}
