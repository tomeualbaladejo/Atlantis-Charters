import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const goReservar = () => {
    if (location.pathname === '/') {
      document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' }), 150)
    }
  }

  const FOOT_LINKS = [
    { labelKey: 'nav.inicio',      path: '/' },
    { labelKey: 'nav.experiencia', path: '/experiencia' },
    { labelKey: 'nav.destinos',    path: '/destinos' },
    { labelKey: 'nav.nosotros',    path: '/nosotros' },
  ]

  return (
    <footer className="footer">
      <div className="foot-inner">
        <Link to="/" className="foot-logo" aria-label="Atlantis Charters — inicio">
          <img src="/images/logo-atlantis.png" alt="Atlantis Charters" />
        </Link>

        <ul className="foot-links">
          {FOOT_LINKS.map(item => (
            <li key={item.labelKey}>
              <Link to={item.path}>{t(item.labelKey)}</Link>
            </li>
          ))}
          <li>
            <button onClick={goReservar}>{t('nav.reservar')}</button>
          </li>
        </ul>

        <p className="foot-copy">{t('footer.copy')}</p>
      </div>
    </footer>
  )
}
