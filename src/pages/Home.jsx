import { useRef, useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLanguage } from '../contexts/LanguageContext'
import { MONTH_NAMES_BY_LANG, DAY_LABELS_BY_LANG, formatDate } from '../i18n/translations'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0 },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
}
const inView = { once: true, margin: '-80px' }

/* ── Google Calendar ── */
const CALENDAR_ID = '5a5db2572ebedac3b8a4ff1b20be073b8c401613be54e5696392b080f17cd66a@group.calendar.google.com'
const API_KEY     = 'AIzaSyCHwWh-VLu5G5zpB8-GsaVd7bHNnJzi1Vw'

function toYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

/* ── Review data ── */
const REVIEWS = [
  {
    initials: 'FM', color: '#C8574A',
    name: 'Felicitas Mias', badge: null,
    text: 'Es el mejor plan que se puede hacer en mallorca. Escaparse de las playas con multitudes y pasar un día tranquilo con los tuyos. Federico fue super amable y nos preparó típicas tapas españolas acompañado por cervezas locales también. Hicimos snorkel paddle surf y disfrutamos de un día maravilloso. Super recomendable !!!!',
    date: 'Hace 10 meses',
  },
  {
    initials: 'MC', color: '#2A6E8A',
    name: 'Marina Graciela Courcelles', badge: 'Local Guide',
    text: 'Una experiencia maravillosa desde que salimos hasta el regreso todo fué mágico! La atención de Felicitas y Federico que están super pendientes de cada detalle para que sea realmente un viaje inolvidable. Lo recomiendo para quienes quieren desconectarse y disfrutar.',
    date: 'Hace 9 meses',
  },
  {
    initials: 'LC', color: '#C49A3C',
    name: 'Luciano Cassoni', badge: null,
    text: 'El mejor plan para pasarla súper bien entre amigos o familia! La barca tradicional del mediterráneo es increíble, muy segura y con mucho estilo y cariño de sus dueños, quienes te hacen sentir como en casa desde el primer momento.',
    date: 'Hace 8 meses',
  },
  {
    initials: 'BP', color: '#C8574A',
    name: 'Belen Pellejero', badge: 'Local Guide',
    text: 'Increíble experiencia para disfrutar con amigos y familia. Recorrimos lugares hermosos y pasamos un día inmejorable. Fede nos hizo sentir como si lo conociéramos desde siempre y nos brindó todo lo necesario para un día perfecto.',
    date: 'Hace 6 meses',
  },
  {
    initials: 'GG', color: '#2A6E8A',
    name: 'Gonzalo Garcia', badge: null,
    text: 'Una experiencia inolvidable, recorrimos rincones hermosos de esta isla. Altamente recomendable, repetiria sin duda.',
    date: 'Hace 7 meses',
  },
  {
    initials: 'JD', color: '#C49A3C',
    name: 'Josefina Damonte', badge: null,
    text: 'Excelente experiencia para recorrer y conocer la isla. Muy amable el staff y la comida riquísima. Recomiendo!!!',
    date: 'Hace 7 meses',
  },
]

/* ── Availability Modal ── */
function AvailabilityModal({ isOpen, onClose, initialPax, initialDuration }) {
  const { t, lang } = useLanguage()
  const MONTH_NAMES = MONTH_NAMES_BY_LANG[lang] || MONTH_NAMES_BY_LANG.es
  const DAY_LABELS  = DAY_LABELS_BY_LANG[lang]  || DAY_LABELS_BY_LANG.es

  const today    = new Date()
  today.setHours(0, 0, 0, 0)
  const todayYMD = toYMD(today)

  const [viewYear,    setViewYear]    = useState(today.getFullYear())
  const [viewMonth,   setViewMonth]   = useState(today.getMonth())
  const [bookedDates, setBookedDates] = useState({})
  const [loading,     setLoading]     = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  const [modalPax,      setModalPax]      = useState('')
  const [modalDuration, setModalDuration] = useState('')
  const [paxError,      setPaxError]      = useState(false)
  const [durError,      setDurError]      = useState(false)

  useEffect(() => {
    if (isOpen) {
      setModalPax(initialPax || '')
      setModalDuration(initialDuration || '')
      setSelectedDate(null)
      setPaxError(false)
      setDurError(false)
    }
  }, [isOpen])

  const cacheKey = `${viewYear}-${viewMonth}`

  const fetchBooked = useCallback(async (year, month) => {
    const key = `${year}-${month}`
    if (bookedDates[key]) return
    setLoading(true)
    try {
      const timeMin = new Date(year, month, 1).toISOString()
      const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`
      const res  = await fetch(url)
      const data = await res.json()
      const dates = new Set(
        (data.items || []).map(ev => ev.start.date || ev.start.dateTime?.split('T')[0]).filter(Boolean)
      )
      setBookedDates(prev => ({ ...prev, [key]: dates }))
    } catch {
      setBookedDates(prev => ({ ...prev, [key]: new Set() }))
    } finally {
      setLoading(false)
    }
  }, [bookedDates])

  useEffect(() => {
    if (isOpen) fetchBooked(viewYear, viewMonth)
  }, [isOpen, viewYear, viewMonth])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const goToPrevMonth = () => {
    const newDate = new Date(viewYear, viewMonth - 1, 1)
    if (newDate < new Date(today.getFullYear(), today.getMonth(), 1)) return
    setViewYear(newDate.getFullYear())
    setViewMonth(newDate.getMonth())
  }

  const goToNextMonth = () => {
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1)
    const newDate = new Date(viewYear, viewMonth + 1, 1)
    if (newDate >= maxDate) return
    setViewYear(newDate.getFullYear())
    setViewMonth(newDate.getMonth())
  }

  const isAtMinMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()
  const isAtMaxMonth = (() => {
    const max = new Date(today.getFullYear(), today.getMonth() + 2, 1)
    return viewYear === max.getFullYear() && viewMonth === max.getMonth()
  })()

  const firstDay = new Date(viewYear, viewMonth, 1)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const bookedSet = bookedDates[cacheKey] || new Set()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd     = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dateObj = new Date(viewYear, viewMonth, d)
    cells.push({
      d, ymd,
      isPast:     dateObj < today,
      isToday:    ymd === todayYMD,
      isBooked:   bookedSet.has(ymd),
      isSelected: ymd === selectedDate,
    })
  }

  const handleDayClick = (cell) => {
    if (!cell || cell.isPast || cell.isBooked) return
    setSelectedDate(cell.ymd)
  }

  const handleWhatsApp = () => {
    const noPax = !modalPax
    const noDur = !modalDuration
    setPaxError(noPax)
    setDurError(noDur)
    if (noPax || noDur) return
    const msg = [
      t('modal.wa.greeting'),
      `${t('modal.wa.date')} ${formatDate(selectedDate, lang)}`,
      `${t('modal.wa.pax')} ${modalPax}`,
      `${t('modal.wa.dur')} ${modalDuration}`,
      t('modal.wa.thanks'),
    ].join('\n')
    window.open(`https://wa.me/34611062419?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay avail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="avail-box"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="avail-header">
              <div>
                <div className="avail-title">{t('modal.title')}</div>
                <div className="avail-subtitle">{t('modal.subtitle')}</div>
              </div>
              <button className="avail-close" onClick={onClose} aria-label={t('modal.close')}>×</button>
            </div>

            {/* Selects */}
            <div className="avail-selects">
              <div className="avail-select-field">
                <label className="avail-select-label" htmlFor="modalPax">{t('modal.pax.label')}</label>
                <select
                  id="modalPax"
                  className={`avail-select${paxError ? ' avail-select--error' : ''}`}
                  value={modalPax}
                  onChange={e => { setModalPax(e.target.value); setPaxError(false) }}
                >
                  <option value="">{t('modal.pax.select')}</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={`${i+1} ${i === 0 ? t('modal.pax.person') : t('modal.pax.plural')}`}>
                      {i+1} {i === 0 ? t('modal.pax.person') : t('modal.pax.plural')}
                    </option>
                  ))}
                </select>
                {paxError && <span className="avail-select-error">{t('modal.pax.error')}</span>}
              </div>
              <div className="avail-select-field">
                <label className="avail-select-label" htmlFor="modalDur">{t('modal.dur.label')}</label>
                <select
                  id="modalDur"
                  className={`avail-select${durError ? ' avail-select--error' : ''}`}
                  value={modalDuration}
                  onChange={e => { setModalDuration(e.target.value); setDurError(false) }}
                >
                  <option value="">{t('modal.dur.select')}</option>
                  <option value={t('modal.dur.morning')}>{t('modal.dur.morning')}</option>
                  <option value={t('modal.dur.afternoon')}>{t('modal.dur.afternoon')}</option>
                  <option value={t('modal.dur.full')}>{t('modal.dur.full')}</option>
                  <option value={t('modal.dur.sunset')}>{t('modal.dur.sunset')}</option>
                </select>
                {durError && <span className="avail-select-error">{t('modal.dur.error')}</span>}
              </div>
            </div>

            {/* Calendar */}
            <div className="avail-body">
              <div className="avail-month-nav">
                <button className="avail-arrow" onClick={goToPrevMonth} disabled={isAtMinMonth} aria-label={t('modal.prev')}>←</button>
                <span className="avail-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <button className="avail-arrow" onClick={goToNextMonth} disabled={isAtMaxMonth} aria-label={t('modal.next')}>→</button>
              </div>

              <div className="avail-day-labels">
                {DAY_LABELS.map(l => <span key={l}>{l}</span>)}
              </div>

              {loading ? (
                <div className="avail-loading">
                  <div className="avail-spinner" />
                  <span>{t('modal.loading')}</span>
                </div>
              ) : (
                <div className="avail-grid">
                  {cells.map((cell, i) =>
                    cell === null ? (
                      <div key={`e-${i}`} />
                    ) : (
                      <button
                        key={cell.ymd}
                        className={[
                          'avail-day',
                          cell.isPast     ? 'avail-day--past'     : '',
                          cell.isBooked   ? 'avail-day--booked'   : '',
                          cell.isToday    ? 'avail-day--today'    : '',
                          cell.isSelected ? 'avail-day--selected' : '',
                        ].join(' ').trim()}
                        onClick={() => handleDayClick(cell)}
                        disabled={cell.isPast || cell.isBooked}
                        aria-label={`${cell.d} ${MONTH_NAMES[viewMonth]}${cell.isBooked ? ` — ${t('modal.legend.booked')}` : ''}`}
                        aria-pressed={cell.isSelected}
                      >
                        {cell.d}
                      </button>
                    )
                  )}
                </div>
              )}

              <div className="avail-legend">
                <span className="legend-item"><span className="legend-dot legend-dot--available" />{t('modal.legend.available')}</span>
                <span className="legend-item"><span className="legend-dot legend-dot--booked" />{t('modal.legend.booked')}</span>
                <span className="legend-item"><span className="legend-dot legend-dot--selected" />{t('modal.legend.selected')}</span>
              </div>
            </div>

            {/* Summary + WhatsApp */}
            {selectedDate && (
              <div className="avail-summary">
                <div className="avail-summary-rows">
                  <div className="avail-summary-row">
                    <span><strong>{t('modal.summary.date')}</strong> {formatDate(selectedDate, lang)}</span>
                  </div>
                </div>
                <button className="avail-whatsapp-btn" onClick={handleWhatsApp}>
                  {t('modal.wa.btn')}
                </button>
                <p className="avail-whatsapp-note">{t('modal.wa.note')}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Home page ── */
export default function Home() {
  const { t } = useLanguage()
  const location    = useLocation()
  const reservarRef = useRef(null)

  const [pax,      setPax]      = useState('')
  const [duration, setDuration] = useState('')
  const [availOpen, setAvailOpen] = useState(false)

  useEffect(() => {
    document.title = 'Atlantis Charters | Alquiler de Barco en Port de Pollença, Mallorca'
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Vive una experiencia única a bordo de nuestro llaut mallorquín tradicional. Excursiones por el norte de Mallorca con snorkel, tapas y rincones secretos. Reserva ahora.')
  }, [])

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 120)
    }
  }, [location.hash])

  return (
    <motion.div
      className="page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Navbar />

      {/* ── AVAILABILITY MODAL ── */}
      <AvailabilityModal
        isOpen={availOpen}
        onClose={() => setAvailOpen(false)}
        initialPax={pax}
        initialDuration={duration}
      />

      {/* ── HERO ── */}
      <section id="inicio" className="hero" aria-label="Portada">
        <video
          className="hero-video"
          autoPlay muted loop playsInline
          poster="/images/style.1.png"
        >
          <source src="/images/Hero.video.mov" type="video/quicktime" />
          <source src="/images/Hero.video.mov" type="video/mp4" />
        </video>
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-content">
          <motion.p
            className="hero-tag"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            {t('hero.tag')}
          </motion.p>

          <motion.h1
            className="hero-headline"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
          >
            {t('hero.h1')}
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55 }}
          >
            {t('hero.sub')}
          </motion.p>

          <motion.div
            className="booking-bar"
            role="search"
            aria-label="Consulta rápida"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.75 }}
          >
            <div className="bfield">
              <label htmlFor="hPax">{t('book.pax')}</label>
              <select id="hPax" value={pax} onChange={e => setPax(e.target.value)}>
                <option value="">{t('book.select')}</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={String(i+1)}>
                    {i+1} {i === 0 ? t('book.pax.person') : t('book.pax.plural')}
                  </option>
                ))}
              </select>
            </div>
            <div className="bfield">
              <label htmlFor="hDur">{t('book.dur')}</label>
              <select id="hDur" value={duration} onChange={e => setDuration(e.target.value)}>
                <option value="">{t('book.select')}</option>
                <option>{t('book.dur.half')}</option>
                <option>{t('book.dur.full')}</option>
                <option>{t('book.dur.sunset')}</option>
              </select>
            </div>
            <button className="booking-cta-btn" onClick={() => setAvailOpen(true)} type="button">
              {t('book.cta')}
            </button>
          </motion.div>
        </div>

        <motion.div
          className="scroll-cue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          aria-hidden="true"
        >
          <span>Scroll</span>
          <div className="scroll-line" />
        </motion.div>
      </section>

      {/* ── REVIEWS ── */}
      <section id="resenas" className="reviews-section" aria-labelledby="resenasHeading">
        <div className="reviews-inner">

          <motion.div
            className="reviews-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inView}
            transition={{ duration: 0.7 }}
          >
            <p className="section-tag">{t('reviews.tag')}</p>
            <h2 className="section-headline" id="resenasHeading">
              {t('reviews.h2')}
            </h2>
            <div className="reviews-rating">
              <span className="reviews-stars" aria-label="5 estrellas">★★★★★</span>
              <span><strong>5.0</strong> · {t('reviews.rating')}</span>
            </div>
          </motion.div>

          <motion.div
            className="reviews-grid"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={inView}
          >
            {REVIEWS.map((r, i) => (
              <motion.article key={i} className="review-card" variants={fadeUp}>
                <div className="reviewer-row">
                  <div className="reviewer-avatar" style={{ background: r.color }} aria-hidden="true">
                    {r.initials}
                  </div>
                  <div>
                    <div className="reviewer-name">{r.name}</div>
                    {r.badge && <span className="local-guide-badge">{r.badge}</span>}
                  </div>
                </div>
                <div className="review-stars" aria-label="5 estrellas">★★★★★</div>
                <p className="review-text">{r.text}</p>
                <div className="review-footer">
                  <span className="review-date">{r.date}</span>
                  <span className="review-source">
                    <span className="google-g" aria-label="Google">G</span> Google
                  </span>
                </div>
              </motion.article>
            ))}
          </motion.div>

          <motion.div
            className="reviews-cta"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inView}
            transition={{ duration: 0.7 }}
          >
            <p>{t('reviews.cta.text')}</p>
            <a
              className="reviews-cta-btn"
              href="https://www.tripadvisor.es/UserReviewEdit-g1028722-d28010616-Atlantis_Experience-Port_de_Pollenca_Majorca_Balearic_Islands.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('reviews.cta.btn')}
            </a>
          </motion.div>

        </div>
      </section>

      {/* ── CONTACT / BOOKING FORM ── */}
      <section id="reservar" className="contact-section" aria-labelledby="resHeading" ref={reservarRef}>
        <motion.div
          className="contact-inner"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
        >
          <motion.h2 className="section-headline" id="resHeading" variants={fadeUp}>
            {t('contact.h2')}
          </motion.h2>

          <motion.div className="contact-grid" variants={fadeUp}>

            {/* LEFT — Map */}
            <div className="contact-map-col">
              <p className="map-label">{t('contact.map.label')}</p>
              <h3 className="map-title">{t('contact.map.title')}</h3>
              <p className="map-desc">{t('contact.map.desc')}</p>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12234.5!2d3.0856!3d39.9017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1297e6196a5c6f79%3A0x9b0a28d40d1f4b8a!2sPuerto%20de%20Pollensa%2C%20Mallorca!5e0!3m2!1ses!2ses!4v1"
                width="100%"
                height="320"
                style={{ border: 0, borderRadius: '16px', filter: 'saturate(1.1)', display: 'block' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Puerto de Pollença, Mallorca"
              />
              <div className="map-pills">
                <span className="map-pill">{t('contact.pill.1')}</span>
                <span className="map-pill">{t('contact.pill.2')}</span>
                <span className="map-pill">+34 611 062 419</span>
              </div>
            </div>

            {/* RIGHT — Contact block */}
            <div className="contact-form-col">
              <p className="map-label">{t('contact.right.label')}</p>
              <h3 className="map-title">{t('contact.right.title')}</h3>
              <p className="map-desc">{t('contact.right.desc')}</p>

              <div className="contact-buttons">
                <a className="contact-btn contact-btn--whatsapp" href="https://wa.me/34611062419" target="_blank" rel="noopener noreferrer">
                  <span className="contact-btn-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.121 1.528 5.856L0 24l6.335-1.51A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.36-.214-3.727.888.929-3.635-.235-.374A9.818 9.818 0 1 1 12 21.818z"/></svg>
                  </span>
                  <span className="contact-btn-text">
                    <span className="contact-btn-sub">{t('contact.wa.sub')}</span>
                    <span className="contact-btn-main">+34 611 062 419</span>
                  </span>
                </a>
                <a className="contact-btn contact-btn--ghost" href="mailto:Atlantis.charter.mallorca@gmail.com">
                  <span className="contact-btn-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </span>
                  <span className="contact-btn-text">
                    <span className="contact-btn-sub">{t('contact.email.sub')}</span>
                    <span className="contact-btn-main">Atlantis.charter.mallorca@gmail.com</span>
                  </span>
                </a>
                <a className="contact-btn contact-btn--ghost" href="https://instagram.com/atlantis.charters" target="_blank" rel="noopener noreferrer">
                  <span className="contact-btn-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </span>
                  <span className="contact-btn-text">
                    <span className="contact-btn-sub">{t('contact.ig.sub')}</span>
                    <span className="contact-btn-main">@atlantis.charters</span>
                  </span>
                </a>
              </div>

              <p className="contact-reassurance">{t('contact.reassurance')}</p>
            </div>

          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </motion.div>
  )
}
