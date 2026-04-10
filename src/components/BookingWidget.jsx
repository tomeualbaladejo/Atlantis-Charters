import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'

const API_BASE = '/api'

// Calendar helper functions
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()
const formatDate = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export default function BookingWidget({ isOpen, onClose, initialSession = '' }) {
  const { t, lang } = useLanguage()

  // Calendar state
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [bookedSlots, setBookedSlots] = useState({})
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  // Selection state
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSession, setSelectedSession] = useState(initialSession || '')

  // Form state
  const [step, setStep] = useState('calendar') // 'calendar' | 'form' | 'success'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    passengers: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reservationId, setReservationId] = useState(null)

  // Fetch availability when month changes
  const fetchAvailability = useCallback(async () => {
    setLoadingAvailability(true)
    try {
      const res = await fetch(`${API_BASE}/availability?year=${currentYear}&month=${currentMonth + 1}`)
      const data = await res.json()
      setBookedSlots(data.bookedSlots || {})
    } catch (err) {
      console.error('Failed to fetch availability:', err)
    } finally {
      setLoadingAvailability(false)
    }
  }, [currentYear, currentMonth])

  useEffect(() => {
    if (isOpen) {
      fetchAvailability()
    }
  }, [isOpen, fetchAvailability])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('calendar')
      setSelectedDate(null)
      setSelectedSession(initialSession || '')
      setFormData({ name: '', email: '', phone: '', passengers: '', message: '' })
      setError('')
      setReservationId(null)
    }
  }, [isOpen, initialSession])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const isDateSelectable = (dateStr, session) => {
    const dateObj = new Date(dateStr + 'T00:00:00')
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Can't book past dates
    if (dateObj < todayStart) return false

    // Check if specific session is booked
    const slots = bookedSlots[dateStr]
    if (!slots) return true

    if (session === 'morning') return !slots.morning
    if (session === 'sunset') return !slots.sunset
    return !slots.morning || !slots.sunset
  }

  const getDateStatus = (dateStr) => {
    const slots = bookedSlots[dateStr]
    if (!slots) return 'available'
    if (slots.morning && slots.sunset) return 'full'
    return 'partial'
  }

  const handleDateClick = (day) => {
    const dateStr = formatDate(currentYear, currentMonth, day)
    const dateObj = new Date(dateStr + 'T00:00:00')
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    if (dateObj < todayStart) return

    setSelectedDate(dateStr)
    setSelectedSession('')
  }

  const handleSessionSelect = (session) => {
    if (!isDateSelectable(selectedDate, session)) return
    setSelectedSession(session)
  }

  const handleContinueToForm = () => {
    if (!selectedDate || !selectedSession) {
      setError(t('booking.error.selectBoth'))
      return
    }
    setError('')
    setStep('form')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate
    if (!formData.name || !formData.email || !formData.phone || !formData.passengers) {
      setError(t('booking.error.required'))
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError(t('booking.error.email'))
      return
    }

    setSubmitting(true)

    try {
      // Create payment session (Stripe Checkout)
      const res = await fetch(`${API_BASE}/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          session: selectedSession,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          passengers: parseInt(formData.passengers),
          message: formData.message
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError(t('booking.error.slotTaken'))
        } else {
          throw new Error(data.error || 'Payment session creation failed')
        }
        return
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Booking error:', err)
      setError(t('booking.error.generic'))
      setSubmitting(false)
    }
  }

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days = []

    // Week day headers
    const weekDays = lang === 'es'
      ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="booking-cal-day booking-cal-day--empty" />)
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(currentYear, currentMonth, day)
      const dateObj = new Date(dateStr + 'T00:00:00')
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const isPast = dateObj < todayStart
      const isSelected = selectedDate === dateStr
      const status = getDateStatus(dateStr)

      let className = 'booking-cal-day'
      if (isPast) className += ' booking-cal-day--past'
      else if (status === 'full') className += ' booking-cal-day--full'
      else if (status === 'partial') className += ' booking-cal-day--partial'
      else className += ' booking-cal-day--available'
      if (isSelected) className += ' booking-cal-day--selected'

      days.push(
        <button
          key={day}
          className={className}
          onClick={() => handleDateClick(day)}
          disabled={isPast || status === 'full'}
          aria-label={`${day} ${status}`}
        >
          {day}
        </button>
      )
    }

    return (
      <div className="booking-calendar">
        <div className="booking-cal-header">
          <button
            className="booking-cal-nav"
            onClick={goToPrevMonth}
            aria-label={t('booking.prevMonth')}
          >
            &larr;
          </button>
          <span className="booking-cal-month">
            {new Date(currentYear, currentMonth).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </span>
          <button
            className="booking-cal-nav"
            onClick={goToNextMonth}
            aria-label={t('booking.nextMonth')}
          >
            &rarr;
          </button>
        </div>

        <div className="booking-cal-weekdays">
          {weekDays.map(d => <div key={d} className="booking-cal-weekday">{d}</div>)}
        </div>

        <div className="booking-cal-grid">
          {days}
        </div>

        <div className="booking-cal-legend">
          <span><span className="legend-dot legend-dot--available" /> {t('booking.legend.available')}</span>
          <span><span className="legend-dot legend-dot--partial" /> {t('booking.legend.partial')}</span>
          <span><span className="legend-dot legend-dot--full" /> {t('booking.legend.full')}</span>
        </div>
      </div>
    )
  }

  // Render session selector
  const renderSessionSelector = () => {
    if (!selectedDate) return null

    const slots = bookedSlots[selectedDate] || {}
    const morningAvailable = !slots.morning
    const afternoonAvailable = !slots.afternoon
    const sunsetAvailable = !slots.sunset

    const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString(
      lang === 'es' ? 'es-ES' : 'en-US',
      { weekday: 'long', day: 'numeric', month: 'long' }
    )

    return (
      <div className="booking-session-selector">
        <p className="booking-selected-date">{dateFormatted}</p>
        <p className="booking-session-label">{t('booking.selectSession')}</p>

        <div className="booking-session-options">
          <button
            className={`booking-session-btn ${selectedSession === 'morning' ? 'booking-session-btn--selected' : ''} ${!morningAvailable ? 'booking-session-btn--disabled' : ''}`}
            onClick={() => handleSessionSelect('morning')}
            disabled={!morningAvailable}
          >
            <span className="booking-session-name">{t('booking.session.morning')}</span>
            <span className="booking-session-time">10:00 - 14:00</span>
            {!morningAvailable && <span className="booking-session-status">{t('booking.booked')}</span>}
          </button>

          <button
            className={`booking-session-btn ${selectedSession === 'afternoon' ? 'booking-session-btn--selected' : ''} ${!afternoonAvailable ? 'booking-session-btn--disabled' : ''}`}
            onClick={() => handleSessionSelect('afternoon')}
            disabled={!afternoonAvailable}
          >
            <span className="booking-session-name">{t('booking.session.afternoon')}</span>
            <span className="booking-session-time">14:30 - 18:30</span>
            {!afternoonAvailable && <span className="booking-session-status">{t('booking.booked')}</span>}
          </button>

          <button
            className={`booking-session-btn ${selectedSession === 'sunset' ? 'booking-session-btn--selected' : ''} ${!sunsetAvailable ? 'booking-session-btn--disabled' : ''}`}
            onClick={() => handleSessionSelect('sunset')}
            disabled={!sunsetAvailable}
          >
            <span className="booking-session-name">{t('booking.session.sunset')}</span>
            <span className="booking-session-time">19:00 - 21:30</span>
            {!sunsetAvailable && <span className="booking-session-status">{t('booking.booked')}</span>}
          </button>

          <button
            className={`booking-session-btn ${selectedSession === 'fullday' ? 'booking-session-btn--selected' : ''} ${!afternoonAvailable || !sunsetAvailable ? 'booking-session-btn--disabled' : ''}`}
            onClick={() => handleSessionSelect('fullday')}
            disabled={!afternoonAvailable || !sunsetAvailable}
          >
            <span className="booking-session-name">{t('booking.session.fullday')}</span>
            <span className="booking-session-time">14:30 - 20:30</span>
            {(!afternoonAvailable || !sunsetAvailable) && <span className="booking-session-status">{t('booking.booked')}</span>}
          </button>
        </div>

        <button
          className="booking-continue-btn"
          onClick={handleContinueToForm}
          disabled={!selectedSession}
        >
          {t('booking.continue')}
        </button>
      </div>
    )
  }

  // Render booking form
  const renderForm = () => {
    const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString(
      lang === 'es' ? 'es-ES' : 'en-US',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    )
    const sessionLabel = selectedSession === 'morning'
      ? t('booking.session.morning')
      : t('booking.session.sunset')

    return (
      <div className="booking-form-container">
        <button className="booking-back-btn" onClick={() => setStep('calendar')}>
          &larr; {t('booking.back')}
        </button>

        <div className="booking-summary-bar">
          <span>{dateFormatted}</span>
          <span className="booking-summary-divider">|</span>
          <span>{sessionLabel}</span>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="booking-form-row">
            <label htmlFor="bk-name">{t('booking.form.name')} *</label>
            <input
              id="bk-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('booking.form.namePlaceholder')}
              required
            />
          </div>

          <div className="booking-form-row">
            <label htmlFor="bk-email">{t('booking.form.email')} *</label>
            <input
              id="bk-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('booking.form.emailPlaceholder')}
              required
            />
          </div>

          <div className="booking-form-row">
            <label htmlFor="bk-phone">{t('booking.form.phone')} *</label>
            <input
              id="bk-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={t('booking.form.phonePlaceholder')}
              required
            />
          </div>

          <div className="booking-form-row">
            <label htmlFor="bk-pax">{t('booking.form.passengers')} *</label>
            <select
              id="bk-pax"
              name="passengers"
              value={formData.passengers}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('booking.form.selectPassengers')}</option>
              {[...Array(6)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? t('booking.form.person') : t('booking.form.people')}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-form-row">
            <label htmlFor="bk-message">{t('booking.form.message')}</label>
            <textarea
              id="bk-message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder={t('booking.form.messagePlaceholder')}
              rows={3}
            />
          </div>

          {error && <p className="booking-error">{error}</p>}

          <div className="booking-payment-info">
            <p className="booking-deposit-text">{t('booking.depositInfo')}</p>
          </div>

          <button
            type="submit"
            className="booking-submit-btn"
            disabled={submitting}
          >
            {submitting ? t('booking.submitting') : (() => {
              const prices = {
                morning: { deposit: 104, total: 520 },
                afternoon: { deposit: 104, total: 520 },
                sunset: { deposit: 70, total: 350 },
                fullday: { deposit: 124, total: 620 }
              }
              const price = prices[selectedSession] || { deposit: 104, total: 520 }
              return `${t('booking.submit')} — ${price.deposit}€ / ${price.total}€`
            })()}
          </button>

          <p className="booking-privacy">{t('booking.privacy')}</p>
        </form>
      </div>
    )
  }

  // Render success message
  const renderSuccess = () => {
    const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString(
      lang === 'es' ? 'es-ES' : 'en-US',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    )
    const sessionLabels = {
      morning: `${t('booking.session.morning')} (10:00 - 14:00)`,
      afternoon: `${t('booking.session.afternoon')} (14:30 - 18:30)`,
      sunset: `${t('booking.session.sunset')} (19:00 - 21:30)`,
      fullday: `${t('booking.session.fullday')} (14:30 - 20:30)`
    }
    const sessionLabel = sessionLabels[selectedSession] || sessionLabels.morning

    return (
      <div className="booking-success">
        <h3>{t('booking.success.title')}</h3>
        <p>{t('booking.success.subtitle')}</p>

        <div className="booking-success-details">
          <div className="booking-success-row">
            <span>{t('booking.success.name')}</span>
            <strong>{formData.name}</strong>
          </div>
          <div className="booking-success-row">
            <span>{t('booking.success.date')}</span>
            <strong>{dateFormatted}</strong>
          </div>
          <div className="booking-success-row">
            <span>{t('booking.success.session')}</span>
            <strong>{sessionLabel}</strong>
          </div>
          <div className="booking-success-row">
            <span>{t('booking.success.passengers')}</span>
            <strong>{formData.passengers}</strong>
          </div>
        </div>

        <p className="booking-success-note">{t('booking.success.emailNote')}</p>

        <div className="booking-success-contact">
          <p>{t('booking.success.questions')}</p>
          <a href="https://wa.me/34611062419" target="_blank" rel="noopener noreferrer" className="booking-wa-btn">
            {t('booking.success.whatsapp')}
          </a>
        </div>

        <button className="booking-close-btn" onClick={onClose}>
          {t('booking.success.close')}
        </button>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="booking-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="booking-modal"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="booking-header">
              <div className="booking-header-left">
                <img src="/images/logo-atlantis.png" alt="Atlantis Charters" />
                <span>{t('booking.title')}</span>
              </div>
              <button className="booking-close" onClick={onClose} aria-label="Cerrar">&times;</button>
            </div>

            {/* Content */}
            <div className="booking-content">
              {loadingAvailability && step === 'calendar' && (
                <div className="booking-loading">
                  <div className="booking-spinner" />
                  <p>{t('booking.loadingAvailability')}</p>
                </div>
              )}

              {step === 'calendar' && !loadingAvailability && (
                <div className="booking-calendar-step">
                  <p className="booking-instruction">{t('booking.instruction')}</p>
                  {renderCalendar()}
                  {renderSessionSelector()}
                  {error && <p className="booking-error">{error}</p>}
                </div>
              )}

              {step === 'form' && renderForm()}

              {step === 'success' && renderSuccess()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
