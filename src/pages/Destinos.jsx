import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLanguage } from '../contexts/LanguageContext'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0 },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.11 } },
}
const inView = { once: true, margin: '-80px' }

/* ─────────────────────────────────────────────
   MODAL CONFIG — slides + content per destination
───────────────────────────────────────────── */
const MODAL_CONFIG = {
  formentor: {
    slides: [
      '/images/formentor/formentor-1.png',
      '/images/formentor/formentor-2.png',
      '/images/formentor/formentor-3.png',
    ],
    title:       'Playa Formentor',
    location:    'Formentor, Pollença · Norte de Mallorca',
    pills:       ['Arena dorada', 'Snorkel', 'Aguas cristalinas'],
    description: '840 metros de arena fina bañados por aguas turquesas rodeadas de pinos mediterráneos. Una de las playas más espectaculares del norte de Mallorca, perfecta para el snorkel, el baño tranquilo y el descanso bajo la sombra de los pinos. Desde el barco, la vista es simplemente única.',
    btn: {
      text:  'Ver reseñas en TripAdvisor →',
      href:  'https://www.tripadvisor.es/Attraction_Review-g1189104-d6429161-Reviews-Formentor_Playa-Formentor_Majorca_Balearic_Islands.html',
      color: '#00AA6C',
    },
  },
  fortaleza: {
    slides: [
      '/images/fortaleza/fortaleza.1.png',
    ],
    title:       'La Fortaleza',
    location:    'Punta de la Avanzada · Port de Pollença',
    pills:       ['Historia', 'Solo desde el mar', 'Vistas únicas'],
    description: 'Construida en 1628 como fortaleza militar antipirata, La Fortaleza es hoy la propiedad más cara de España y uno de los lugares más exclusivos del Mediterráneo. Solo accesible desde el mar — desde el Atlantis tendrás las mejores vistas de esta joya histórica de la Bahía de Pollença.',
    btn: {
      text:  'Ver en Google Maps →',
      href:  'https://maps.app.goo.gl/xDZEw452XzYQhqD3A',
      color: '#C8574A',
    },
  },
  'isla-formentor': {
    slides: [
      '/images/isla-de-formentor/isla-formentor.1.png',
      '/images/isla-de-formentor/isla-formentor.2.png',
      '/images/isla-de-formentor/isla-formentor.3.png',
    ],
    title:       'Isla de Formentor',
    location:    'Cap de Formentor · Mallorca Norte',
    pills:       ['Fauna marina', 'Snorkel', 'Cueva marina'],
    description: 'Un islote mágico junto a la playa de Formentor con una espectacular cueva marina que solo puede visitarse en barco. El snorkel alrededor de sus rocas revela una vida submarina increíble — peces de colores, fondos de roca y una claridad de agua que parece irreal. Una de las paradas favoritas a bordo del Atlantis.',
    btn: {
      text:  'Ver en TripAdvisor →',
      href:  'https://www.tripadvisor.es/Attraction_Review-g1189104-d6429161-Reviews-Formentor_Playa-Formentor_Majorca_Balearic_Islands.html',
      color: '#00AA6C',
    },
  },
  'la-victoria': {
    slides: [
      '/images/la-victoria/la-victoria.1.png',
      '/images/la-victoria/la-victoria.2.png',
      '/images/la-victoria/la-victoria.3.png',
    ],
    title:       'La Victoria',
    location:    'Península de La Victoria · Alcúdia',
    pills:       ['Naturaleza virgen', 'Aguas esmeralda', 'Calas escondidas'],
    description: 'La Península de La Victoria es uno de los secretos mejor guardados del norte de Mallorca. Calas de agua esmeralda rodeadas de acantilados y pinos, sin aglomeraciones y con una tranquilidad única. Desde el Atlantis llegamos a rincones imposibles de alcanzar a pie — un privilegio reservado para quien navega con nosotros.',
    btn: {
      text:  'Ver reseñas en Google →',
      href:  'https://www.google.com/search?q=La+Victoria+Mallorca+Reservas',
      color: '#4285F4',
    },
  },
  'cala-murta': {
    slides: [
      '/images/cala-murta/cala-murta.1.png',
      '/images/cala-murta/cala-murta.2.png',
    ],
    title:       'Cala Murta',
    location:    'Península de Formentor · UNESCO',
    pills:       ['Cala virgen', 'Snorkel', 'Aguas cristalinas'],
    description: 'Una de las calas más vírgenes y protegidas de todo Mallorca, dentro de la Reserva Natural de Formentor (Patrimonio UNESCO). Sin servicios, sin aglomeraciones — solo naturaleza pura y un agua de una claridad extraordinaria. El fondo de roca y arena es perfecto para el snorkel. Solo accesible cómodamente desde el mar.',
    btn: {
      text:  'Ver en TripAdvisor →',
      href:  'https://www.tripadvisor.es/Attraction_Review-g1028722-d8471988-Reviews-Cala_Murta-Port_de_Pollenca_Majorca_Balearic_Islands.html',
      color: '#00AA6C',
    },
  },
}

/* ─────────────────────────────────────────────
   DESTINATION CARDS DATA
───────────────────────────────────────────── */
const DESTINATIONS = [
  {
    modalId: 'fortaleza',
    img:     '/images/fortaleza/main.fortaleza.png',
    alt:     'La Fortaleza, Bahía de Pollença',
    badge:   'Punto emblemático',
    title:   ['La ', 'Fortaleza'],
    bullets: [
      'Solo visible desde el mar — acceso exclusivo en barco',
      'Fortaleza del s. XVII, hoy la propiedad más cara de España',
      'Vista panorámica de la Bahía de Pollença',
    ],
  },
  {
    modalId: 'formentor',
    img:     '/images/formentor/main.formentor.png',
    alt:     'Playa Formentor, Mallorca',
    badge:   'Arena dorada',
    title:   ['Playa ', 'Formentor'],
    bullets: [
      '840m de arena fina y aguas turquesas cristalinas',
      'Pinos mediterráneos que dan sombra natural sobre la orilla',
      'Ideal para snorkel, paddle surf y baño tranquilo',
    ],
  },
  {
    modalId: 'cala-murta',
    img:     '/images/cala-murta/main.cala-murta.png',
    alt:     'Cala Murta, Reserva de Formentor',
    badge:   'Snorkel top',
    title:   ['Cala ', 'Murta'],
    bullets: [
      'Cala virgen dentro de la Reserva de Formentor (UNESCO)',
      'Fondo de roca y arena con gran variedad de peces',
      'Sin aglomeraciones — solo accesible cómodamente desde el mar',
    ],
  },
  {
    modalId: 'la-victoria',
    img:     '/images/la-victoria/main.la-victoria.png',
    alt:     'Península de La Victoria, Mallorca',
    badge:   'Aguas tranquilas',
    title:   ['La ', 'Victoria'],
    bullets: [
      'Península salvaje entre Alcúdia y Pollença',
      'Calas escondidas perfectas para el baño',
      'Paisaje de acantilados y pinos sobre el Mediterráneo',
    ],
  },
  {
    modalId: 'isla-formentor',
    img:     '/images/isla-de-formentor/main.isla-de-formentor.png',
    alt:     'Isla de Formentor, Mallorca',
    badge:   'Fauna marina',
    title:   ['Isla de ', 'Formentor'],
    bullets: [
      'Islote junto a la playa con una espectacular cueva marina',
      'Snorkel entre las rocas con gran diversidad de peces',
      'Espectacular desde el mar a bordo del Atlantis',
    ],
  },
]

/* ─────────────────────────────────────────────
   UNIFIED MODAL COMPONENT
───────────────────────────────────────────── */
function DestModal({ activeId, currentSlide, onClose, onPrev, onNext }) {
  const { t } = useLanguage()
  if (!activeId) return null
  const cfg = MODAL_CONFIG[activeId]
  if (!cfg) return null

  const { slides, title, location, pills, description, btn } = cfg
  const single = slides.length === 1

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`Galería ${title}`}
    >
      <div className="modal-box">

        {/* Slideshow */}
        <div className="modal-slideshow">
          {slides.map((src, i) => (
            <img
              key={i}
              className={`slide${currentSlide === i ? ' active' : ''}`}
              src={src}
              alt={`${title} ${i + 1}`}
            />
          ))}

          {!single && (
            <>
              <button className="modal-arrow modal-arrow-prev" onClick={onPrev} aria-label="Anterior">←</button>
              <button className="modal-arrow modal-arrow-next" onClick={onNext} aria-label="Siguiente">→</button>
              <div className="modal-dots" aria-hidden="true">
                {slides.map((_, i) => (
                  <span key={i} className={`dot${currentSlide === i ? ' active' : ''}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Close */}
        <button className="modal-close" onClick={onClose} aria-label={t('dest.modal.close')}>×</button>

        {/* Content */}
        <div className="modal-content">
          <h3 className="modal-title">{title}</h3>
          <p className="modal-location">{location}</p>
          <hr className="card-divider" aria-hidden="true" />
          <div className="modal-pills">
            {pills.map((p, i) => <span key={i} className="modal-pill">{p}</span>)}
          </div>
          <p className="modal-desc">{description}</p>
          <a
            className="modal-tripadvisor"
            style={{ background: btn.color }}
            href={btn.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {btn.text}
          </a>
        </div>

      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   TEASER ICON
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function Destinos() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [activeModal, setActiveModal] = useState(null)
  const [slide,       setSlide]       = useState(0)
  const [resetKey,    setResetKey]    = useState(0)

  const slideCount = activeModal ? (MODAL_CONFIG[activeModal]?.slides.length ?? 1) : 1

  useEffect(() => {
    if (!activeModal || slideCount <= 1) return
    const timer = setInterval(() => setSlide(s => (s + 1) % slideCount), 3500)
    return () => clearInterval(timer)
  }, [activeModal, resetKey, slideCount])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && activeModal) closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [activeModal])

  useEffect(() => {
    document.body.style.overflow = activeModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [activeModal])

  const openModal  = (id) => { setSlide(0); setActiveModal(id) }
  const closeModal = ()   => setActiveModal(null)
  const goNext     = ()   => { setSlide(s => (s + 1) % slideCount);              setResetKey(k => k + 1) }
  const goPrev     = ()   => { setSlide(s => (s + slideCount - 1) % slideCount); setResetKey(k => k + 1) }

  const goReservar = () => {
    navigate('/')
    setTimeout(() => document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' }), 150)
  }

  useEffect(() => {
    document.title = 'Destinos y Calas en Barco desde Port de Pollença | Atlantis Charters'
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Descubre las mejores calas y rutas en barco desde Port de Pollença, Mallorca. Cala Figuera, Formentor y más destinos exclusivos con Atlantis Charters.')

    // Set canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = 'https://atlantis-charters.vercel.app/destinos'

    // Set OG tags
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', 'Destinos y Calas en Barco desde Port de Pollença | Atlantis Charters')
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', 'Descubre las mejores calas y rutas en barco desde Port de Pollença, Mallorca. Cala Figuera, Formentor y más destinos exclusivos con Atlantis Charters.')
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', 'https://atlantis-charters.vercel.app/destinos')

    // Set Twitter tags
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', 'Destinos y Calas en Barco desde Port de Pollença | Atlantis Charters')
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', 'Descubre las mejores calas y rutas en barco desde Port de Pollença, Mallorca. Cala Figuera, Formentor y más destinos exclusivos con Atlantis Charters.')
  }, [])

  return (
    <motion.div
      className="page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Navbar />

      {/* ── PAGE HERO ── */}
      <section className="page-hero" aria-labelledby="heroHeading">
        <motion.p
          className="page-hero-tag"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {t('dest.page.tag')}
        </motion.p>
        <motion.h1
          id="heroHeading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          {t('dest.page.h1')}
        </motion.h1>
        <motion.p
          className="page-hero-sub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t('dest.page.sub')}
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
          {DESTINATIONS.map((dest) => (
            <motion.article
              key={dest.modalId}
              className="dest-card dest-card-clickable"
              variants={fadeUp}
              onClick={() => openModal(dest.modalId)}
              role="button"
              tabIndex={0}
              aria-label={`${dest.title.join('')} — Ver galería`}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && openModal(dest.modalId)}
            >
              <div className="card-photo-wrap">
                <img
                  className="card-photo"
                  src={dest.img}
                  alt={dest.alt}
                  loading="lazy"
                />
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
                <div className="card-gallery-trigger" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <polygon points="0,0 10,5 0,10" />
                  </svg>
                  {t('dest.card.gallery')}
                </div>
              </div>
            </motion.article>
          ))}

          {/* Teaser card */}
          <motion.article className="dest-card card-teaser" variants={fadeUp}>
            <div className="teaser-icon" aria-hidden="true"><PalmIcon /></div>
            <h2 className="teaser-title">{t('dest.teaser.title')}</h2>
            <p className="teaser-body">{t('dest.teaser.body')}</p>
            <button className="teaser-btn" onClick={goReservar}>
              {t('dest.teaser.btn')}
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
        <h2 id="ctaHeading">{t('dest.cta.h2')}</h2>
        <p>{t('dest.cta.body')}</p>
        <div className="cta-buttons">
          <button className="btn-filled" onClick={goReservar}>
            {t('dest.cta.btn')}
          </button>
          <Link to="/" className="btn-outline">{t('dest.cta.home')}</Link>
        </div>
      </motion.section>

      <Footer />

      {/* ── MODAL ── */}
      <DestModal
        activeId={activeModal}
        currentSlide={slide}
        onClose={closeModal}
        onPrev={goPrev}
        onNext={goNext}
      />
    </motion.div>
  )
}
