import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LanguageProvider } from './contexts/LanguageContext'
import Home        from './pages/Home'
import Experiencia from './pages/Experiencia'
import Destinos    from './pages/Destinos'
import Nosotros    from './pages/Nosotros'

export default function App() {
  const location = useLocation()
  return (
    <LanguageProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"            element={<Home />} />
          <Route path="/experiencia" element={<Experiencia />} />
          <Route path="/destinos"    element={<Destinos />} />
          <Route path="/nosotros"    element={<Nosotros />} />
          {/* backward-compat redirect */}
          <Route path="/places"      element={<Navigate to="/destinos" replace />} />
        </Routes>
      </AnimatePresence>
    </LanguageProvider>
  )
}
