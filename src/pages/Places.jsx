import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0 },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.11 } },
}
const inView = { once: true, margin: '-80px' }

/* ── Destination cards data (all except Formentor, which is rendered specially) ── */
const BEFORE_FORMENTOR = [
  {
    img: 'https://images.unsplash.com/photo-1602940659805-770d1b3b9911?w=800&q=80',
    alt: 'La Fortaleza, Bahía de Pollença',
    badge: 'Punto emblemático',
    title: ['La ', 'Fortaleza'],
    bullets: [
      'Solo visible desde el mar — acceso exclusivo en barco',
      'Fortaleza del s. XVII, hoy la propiedad más cara de España',
      'Vista panorámica de la Bahía de Pollença',
    ],
  },
]

const AFTER_FORMENTOR = [
  {
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    alt: 'Cala Murta, Reserva de Formentor',
    badge: 'Snorkel top',
    title: ['Cala ', 'Murta'],
    bullets: [
      'Cala virgen dentro de la Reserva de Formentor (UNESCO)',
      'Fondo de roca y arena con gran variedad de peces',
      'Sin aglomeraciones — solo accesible cómodamente desde el mar',
    ],
  },
  {
    img: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
    alt: 'Península de La Victoria, Mallorca',
    badge: 'Aguas tranquilas',
    title: ['La ', 'Victoria'],
    bullets: [
      'Península salvaje entre Alcúdia y Pollença',
      'Calas escondidas perfectas para el baño',
      'Paisaje de acantilados y pinos sobre el Mediterráneo',
    ],
  },
  {
    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    alt: 'Isla de Formentor, Mallorca',
    badge: 'Fauna marina',
    title: ['Isla de ', 'Formentor'],
    bullets: [
      'Islote junto a la playa con una espectacular cueva marina',
      'Snorkel entre las rocas con gran diversidad de peces',
      'Espectacular desde el mar a bordo del Atlantis',
    ],
  },
]

const FORMENTOR_SLIDES = [
  '/images/formentor/formentor-1.png',
  '/images/formentor/formentor-2.png',
  '/images/formentor/formentor-3.png',
]

function DestCard({ dest, variants }) {
  return (
    <motion.article className="dest-card" variants={variants}>
      <div className="card-photo-wrap">
        <img className="card-photo" src={dest.img} alt={dest.alt} loading="lazy" />
      </div>
      <div className="card-body">
        <span className="card-badge">{dest.badge}</span>
        <h2 className="card-title">
          {dest.title[0]}<span className="highlight">{dest.title[1]}</span>
        </h2>
        <hr className="card-divider" aria-hidden="true" />
        <ul className="card-bullets">
          {dest.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      </div>
    </motion.article>
  )
}

function PalmIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h11z"/>
      <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-9"/>
      <path d="M13 12.07c0 1.18.4 2.3 1.07 3.22A7.12 7.12 0 0 1 13 21H9c-.26-2.4.48-4.29 1.93-6.07A4.82 4.82 0 0 0 12 12h1v.07z"/>
      <path d="M9 21h6"/>
    </svg>
  )
}

/* ── Formentor Modal ── */
function FormentorModal({ isOpen, onClose, slide, onPrev, onNext }) {
  if (!isOpen) return null
  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Galería Playa Formentor"
    >
      <div className="modal-box">

        {/* Slideshow */}
        <div className="modal-slideshow">
          {FORMENTOR_SLIDES.map((src, i) => (
            <img
              key={i}
              className={`slide${slide === i ? ' active' : ''}`}
              src={src}
              alt={`Playa Formentor ${i + 1}`}
            />
          ))}

          {/* Arrows */}
          <button
            className="modal-arrow modal-arrow-prev"
            onClick={onPrev}
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            className="modal-arrow modal-arrow-next"
            onClick={onNext}
            aria-label="Siguiente"
          >
            →
          </button>

          {/* Dots */}
          <div className="modal-dots" aria-hidden="true">
            {FORMENTOR_SLIDES.map((_, i) => (
              <span key={i} className={`dot${slide === i ? ' active' : ''}`} />
            ))}
          </div>
        </div>

        {/* Close */}
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>

        {/* Content */}
        <div className="modal-content">
          <h3 className="modal-title">Playa Formentor</h3>
          <p className="modal-location">Formentor, Pollença · Norte de Mallorca</p>

          <hr className="card-divider" aria-hidden="true" />

          <div className="modal-pills">
            <span className="modal-pill">Arena dorada</span>
            <span className="modal-pill">Snorkel</span>
            <span className="modal-pill">Aguas cristalinas</span>
          </div>

          <p className="modal-desc">
            840 metros de arena fina bañados por aguas turquesas rodeadas de pinos mediterráneos. Una de las playas más espectaculares del norte de Mallorca, perfecta para el snorkel, el baño tranquilo y el descanso bajo la sombra de los pinos. Desde el barco, la vista es simplemente única.
          </p>

          <a
            className="modal-tripadvisor"
            href="https://www.tripadvisor.es/Attraction_Review-g1189104-d6429161-Reviews-Formentor_Playa-Formentor_Majorca_Balearic_Islands.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            ⭐ Ver reseñas en TripAdvisor →
          </a>
        </div>

      </div>
    </div>
  )
}

export default function Places() {
  const navigate = useNavigate()

  /* ── Modal state ── */
  const [modalOpen,  setModalOpen]  = useState(false)
  const [slide,      setSlide]      = useState(0)
  const [resetKey,   setResetKey]   = useState(0)   // bumping restarts autoplay

  /* ── Autoplay: restarts when modal opens or resetKey changes ── */
  useEffect(() => {
    if (!modalOpen) return
    const t = setInterval(() => setSlide(s => (s + 1) % 3), 3500)
    return () => clearInterval(t)
  }, [modalOpen, resetKey])

  /* ── Escape key ── */
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* ── Lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

  const openModal = () => { setSlide(0); setModalOpen(true) }
  const closeModal = () => setModalOpen(false)

  const goNext = () => { setSlide(s => (s + 1) % 3); setResetKey(k => k + 1) }
  const goPrev = () => { setSlide(s => (s + 2) % 3); setResetKey(k => k + 1) }

  const goReservar = () => {
    navigate('/#reservar')
    setTimeout(() => document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' }), 150)
  }

  return (
    <motion.div
      className="page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Navbar variant="light" />

      {/* ── PAGE HERO ── */}
      <section className="page-hero" aria-labelledby="heroHeading">
        <motion.p
          className="page-hero-tag"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Norte de Mallorca&nbsp;·&nbsp;Bahía de Pollença
        </motion.p>
        <motion.h1
          id="heroHeading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Nuestros destinos secretos
        </motion.h1>
        <motion.p
          className="page-hero-sub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Cada salida es única. Estos son los rincones que visitamos a bordo del Atlantis.
        </motion.p>
        <motion.hr
          className="hero-rule"
          aria-hidden="true"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        />
      </section>

      {/* ── DESTINATIONS GRID ── */}
      <section className="destinations-section" aria-label="Destinos">
        <motion.div
          className="destinations-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
        >
          {/* Cards before Formentor */}
          {BEFORE_FORMENTOR.map((dest, i) => (
            <DestCard key={i} dest={dest} variants={fadeUp} />
          ))}

          {/* ── Playa Formentor — clickable card with gallery ── */}
          <motion.article
            className="dest-card dest-card-clickable"
            variants={fadeUp}
            onClick={openModal}
            role="button"
            tabIndex={0}
            aria-label="Playa Formentor — Ver galería"
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && openModal()}
          >
            <div className="card-photo-wrap">
              <img
                className="card-photo"
                src="/images/formentor/main.formentor.png"
                alt="Playa Formentor"
                loading="lazy"
              />
            </div>
            <div className="card-body">
              <span className="card-badge">Arena dorada</span>
              <h2 className="card-title">
                Playa <span className="highlight">Formentor</span>
              </h2>
              <hr className="card-divider" aria-hidden="true" />
              <ul className="card-bullets">
                <li>840m de arena fina y aguas turquesas cristalinas</li>
                <li>Pinos mediterráneos que dan sombra natural sobre la orilla</li>
                <li>Ideal para snorkel, paddle surf y baño tranquilo</li>
              </ul>
              <div className="card-gallery-trigger" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <polygon points="0,0 10,5 0,10"/>
                </svg>
                Ver galería →
              </div>
            </div>
          </motion.article>

          {/* Cards after Formentor */}
          {AFTER_FORMENTOR.map((dest, i) => (
            <DestCard key={i} dest={dest} variants={fadeUp} />
          ))}

          {/* Teaser card */}
          <motion.article className="dest-card card-teaser" variants={fadeUp}>
            <div className="teaser-icon" aria-hidden="true"><PalmIcon /></div>
            <h2 className="teaser-title">Y otros rincones secretos...</h2>
            <p className="teaser-body">
              Cada día es diferente. El capitán elige la ruta según el viento, el mar y la magia del momento.
            </p>
            <button className="teaser-btn" onClick={goReservar}>
              Reservar ahora →
            </button>
          </motion.article>
        </motion.div>
      </section>

      {/* ── BOTTOM CTA STRIP ── */}
      <motion.section
        className="cta-strip"
        aria-labelledby="ctaHeading"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={inView}
        transition={{ duration: 0.7 }}
      >
        <h2 id="ctaHeading">¿Quieres descubrir estos lugares?</h2>
        <p>Embarca con nosotros. El Mediterráneo tiene muchas caras — te mostraremos las más bonitas.</p>
        <div className="cta-buttons">
          <button className="btn-filled" onClick={goReservar}>
            Consultar disponibilidad →
          </button>
          <Link to="/" className="btn-outline">Volver al inicio</Link>
        </div>
      </motion.section>

      <Footer />

      {/* ── FORMENTOR MODAL ── */}
      <FormentorModal
        isOpen={modalOpen}
        onClose={closeModal}
        slide={slide}
        onPrev={goPrev}
        onNext={goNext}
      />
    </motion.div>
  )
}
