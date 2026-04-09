import { useState, useEffect, useCallback } from 'react'

const API_BASE = '/api'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [reservations, setReservations] = useState([])
  const [stats, setStats] = useState({ total: 0, confirmed: 0, cancelled: 0, totalPassengers: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Check if already authenticated (stored in sessionStorage)
  useEffect(() => {
    const storedAuth = sessionStorage.getItem('adminAuth')
    if (storedAuth) {
      setIsAuthenticated(true)
      setPassword(storedAuth)
    }
  }, [])

  const fetchReservations = useCallback(async () => {
    if (!password) return

    setLoading(true)
    setError('')

    try {
      let url = `${API_BASE}/admin-reservations?`
      if (statusFilter) url += `status=${statusFilter}&`
      if (fromDate) url += `from=${fromDate}&`
      if (toDate) url += `to=${toDate}&`

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${password}` }
      })

      if (res.status === 401) {
        setError('Contraseña incorrecta')
        setIsAuthenticated(false)
        sessionStorage.removeItem('adminAuth')
        return
      }

      const data = await res.json()
      setReservations(data.reservations || [])
      setStats(data.stats || { total: 0, confirmed: 0, cancelled: 0, totalPassengers: 0 })
    } catch (err) {
      setError('Error al cargar las reservas')
    } finally {
      setLoading(false)
    }
  }, [password, statusFilter, fromDate, toDate])

  useEffect(() => {
    if (isAuthenticated) {
      fetchReservations()
    }
  }, [isAuthenticated, fetchReservations])

  const handleLogin = (e) => {
    e.preventDefault()
    if (!password.trim()) return

    sessionStorage.setItem('adminAuth', password)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
    setPassword('')
    setReservations([])
  }

  const handleCancel = async (id, email) => {
    if (!confirm(`¿Cancelar esta reserva? Se enviará un email a ${email}`)) return

    try {
      const res = await fetch(`${API_BASE}/cancel-reservation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, sendEmail: true })
      })

      if (res.ok) {
        fetchReservations()
      } else {
        alert('Error al cancelar la reserva')
      }
    } catch (err) {
      alert('Error al cancelar la reserva')
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatSession = (session) => {
    const sessions = {
      morning: 'Mañana (10:00-14:00)',
      afternoon: 'Tarde (14:30-18:30)',
      sunset: 'Atardecer (19:00-21:30)',
      fullday: 'Día completo (14:30-20:30)'
    }
    return sessions[session] || sessions.morning
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h1>Panel de Administración</h1>
          <p>Atlantis Charters</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p style={{ color: '#DC2626', marginBottom: '16px' }}>{error}</p>}
            <button type="submit">Entrar</button>
          </form>
        </div>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Reservas Atlantis</h1>
        <button className="admin-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-value">{stats.total}</div>
          <div className="admin-stat-label">Total reservas</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-value">{stats.confirmed}</div>
          <div className="admin-stat-label">Confirmadas</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-value">{stats.cancelled}</div>
          <div className="admin-stat-label">Canceladas</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-value">{stats.totalPassengers}</div>
          <div className="admin-stat-label">Pasajeros totales</div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          placeholder="Desde"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          placeholder="Hasta"
        />
        <button
          className="admin-action-btn"
          onClick={() => { setStatusFilter(''); setFromDate(''); setToDate('') }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-empty">Cargando...</div>
      ) : reservations.length === 0 ? (
        <div className="admin-empty">No hay reservas</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Sesión</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Pax</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{formatSession(r.session)}</td>
                  <td>{r.name}</td>
                  <td>
                    <a href={`mailto:${r.email}`}>{r.email}</a>
                  </td>
                  <td>
                    <a href={`tel:${r.phone}`}>{r.phone}</a>
                  </td>
                  <td>{r.passengers}</td>
                  <td>
                    <span className={`admin-status admin-status--${r.status}`}>
                      {r.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                    </span>
                  </td>
                  <td>
                    {r.status === 'confirmed' && (
                      <button
                        className="admin-action-btn admin-action-btn--danger"
                        onClick={() => handleCancel(r.id, r.email)}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
