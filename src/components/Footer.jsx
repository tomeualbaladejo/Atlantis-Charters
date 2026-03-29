import { Link, useNavigate, useLocation } from 'react-router-dom'

const FOOT_LINKS = [
  { label: 'Inicio',      path: '/' },
  { label: 'Experiencia', path: '/experiencia' },
  { label: 'Destinos',    path: '/destinos' },
  { label: 'Nosotros',    path: '/nosotros' },
]

export default function Footer() {
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

  return (
    <footer className="footer">
      <div className="foot-inner">
        <Link to="/" className="foot-logo" aria-label="Atlantis Charters — inicio">
          <img src="/images/logo-atlantis.png" alt="Atlantis Charters" />
        </Link>

        <ul className="foot-links">
          {FOOT_LINKS.map(item => (
            <li key={item.label}>
              <Link to={item.path}>{item.label}</Link>
            </li>
          ))}
          <li>
            <button onClick={goReservar}>Reservar</button>
          </li>
        </ul>

        <p className="foot-copy">© 2025 Atlantis Charters&nbsp;·&nbsp;Mallorca</p>
      </div>
    </footer>
  )
}
