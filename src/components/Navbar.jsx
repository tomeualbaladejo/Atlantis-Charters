import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'

const LANG_OPTIONS = [
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
]

function LangSelector() {
  const { lang, changeLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = LANG_OPTIONS.find(l => l.code === lang) || LANG_OPTIONS[0]

  return (
    <div className="lang-selector" ref={ref}>
      <button
        className="lang-current"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Seleccionar idioma"
      >
        <span className="lang-flag">{current.flag}</span>
        <span className="lang-code">{current.label}</span>
        <svg className={`lang-chevron${open ? ' open' : ''}`} width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="lang-dropdown"
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {LANG_OPTIONS.map(opt => (
              <li key={opt.code} role="option" aria-selected={opt.code === lang}>
                <button
                  className={`lang-option${opt.code === lang ? ' active' : ''}`}
                  onClick={() => { changeLang(opt.code); setOpen(false) }}
                >
                  <span className="lang-flag">{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar() {
  const { t } = useLanguage()
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

  const NAV_ITEMS = [
    { labelKey: 'nav.inicio',      path: '/' },
    { labelKey: 'nav.experiencia', path: '/experiencia' },
    { labelKey: 'nav.destinos',    path: '/destinos' },
    { labelKey: 'nav.nosotros',    path: '/nosotros' },
  ]

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Navegación principal">
        <Link to="/" onClick={() => setMenuOpen(false)} aria-label="Inicio" className="navbar-logo">
          <img src="/images/logo-atlantis.png" alt="Atlantis Charters" />
        </Link>

        <ul className="navbar-links">
          {NAV_ITEMS.map(item => (
            <li key={item.labelKey}>
              <Link
                to={item.path}
                className={isActive(item.path) ? 'active' : ''}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                {t(item.labelKey)}
              </Link>
            </li>
          ))}
          <li><LangSelector /></li>
          <li>
            <button className="navbar-cta" onClick={goReservar}>
              {t('nav.reservar')}
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
                key={item.labelKey}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={isActive(item.path) ? 'terra' : ''}
                >
                  {t(item.labelKey)}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: NAV_ITEMS.length * 0.07 }}
              style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}
            >
              <LangSelector />
            </motion.div>
            <motion.button
              className="terra"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (NAV_ITEMS.length + 1) * 0.07 }}
              onClick={goReservar}
            >
              {t('nav.reservar')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
