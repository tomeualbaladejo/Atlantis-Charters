import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'
import { useBooking } from '../contexts/BookingContext'

/* ── SVG Flag components ── */
function FlagES() {
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" xmlns="http://www.w3.org/2000/svg" style={{display:'block',borderRadius:'3px'}}>
      <rect width="30" height="20" fill="#c60b1e"/>
      <rect y="5" width="30" height="10" fill="#ffc400"/>
    </svg>
  )
}
function FlagGB() {
  return (
    <svg viewBox="0 0 60 30" width="30" height="20" xmlns="http://www.w3.org/2000/svg" style={{display:'block',borderRadius:'3px'}}>
      <rect width="60" height="30" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
    </svg>
  )
}
function FlagDE() {
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" xmlns="http://www.w3.org/2000/svg" style={{display:'block',borderRadius:'3px'}}>
      <rect width="30" height="20" fill="#000"/>
      <rect y="6.67" width="30" height="6.67" fill="#D00"/>
      <rect y="13.34" width="30" height="6.66" fill="#FFCE00"/>
    </svg>
  )
}
function FlagFR() {
  return (
    <svg viewBox="0 0 30 20" width="30" height="20" xmlns="http://www.w3.org/2000/svg" style={{display:'block',borderRadius:'3px'}}>
      <rect width="30" height="20" fill="#ED2939"/>
      <rect width="20" height="20" fill="#fff"/>
      <rect width="10" height="20" fill="#002395"/>
    </svg>
  )
}

const FLAG_MAP = { es: <FlagES/>, en: <FlagGB/>, de: <FlagDE/>, fr: <FlagFR/> }

const LANG_OPTIONS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
]

function LangSelector() {
  const { lang, changeLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="lang-selector" ref={ref}>
      <button
        className="lang-current"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
      >
        {FLAG_MAP[lang] || <FlagES/>}
        <svg className={`lang-chevron${open ? ' open' : ''}`} width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
                  aria-label={opt.label}
                >
                  {FLAG_MAP[opt.code]}
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
  const { openBooking } = useBooking()
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
      openBooking()
    } else {
      navigate('/?booking=open')
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
