import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { label: 'Inicio',      path: '/' },
  { label: 'Experiencia', path: '/experiencia' },
  { label: 'Destinos',    path: '/destinos' },
  { label: 'Nosotros',    path: '/nosotros' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const goReservar = () => {
    setMenuOpen(false)
    if (location.pathname === '/') {
      document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' }), 150)
    }
  }

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname === path

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Navegación principal">
        <Link to="/" onClick={() => setMenuOpen(false)} aria-label="Inicio" className="navbar-logo">
          <img src="/images/logo-atlantis.png" alt="Atlantis Charters" />
        </Link>

        <ul className="navbar-links">
          {NAV_ITEMS.map(item => (
            <li key={item.label}>
              <Link
                to={item.path}
                className={isActive(item.path) ? 'active' : ''}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <button className="navbar-cta" onClick={goReservar}>
              Reservar
            </button>
          </li>
        </ul>

        <button
          className={`hamburger-btn${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {NAV_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={isActive(item.path) ? 'terra' : ''}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <motion.button
              className="terra"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: NAV_ITEMS.length * 0.07 }}
              onClick={goReservar}
            >
              Reservar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
