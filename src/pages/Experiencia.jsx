import { useNavigate } from 'react-router-dom'
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
  show:   { transition: { staggerChildren: 0.12 } },
}
const inView = { once: true, margin: '-80px' }

function IconAnchor() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/>
      <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
    </svg>
  )
}
function IconFish() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6z"/>
      <path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/>
      <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 3.04-.23 5.7 1.02 7.5-1.27 1.82-2 4.47-1 7.5C5.58 20.03 7 18 7 13.33"/>
      <path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4"/>
      <circle cx="11.5" cy="11.5" r=".5" fill="currentColor"/>
    </svg>
  )
}
function IconGlass() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/>
      <path d="M17 2H7l-1 8a5 5 0 0 0 10 0l-1-8z"/>
    </svg>
  )
}

export default function Experiencia() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const goReservar = () => {
    navigate('/')
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
      <Navbar />

      {/* ── PAGE HERO ── */}
      <section className="page-hero" aria-labelledby="expPageHeading">
        <motion.p
          className="page-hero-tag"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {t('exp.page.tag')}
        </motion.p>
        <motion.h1
          id="expPageHeading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          {t('exp.page.h1')}
        </motion.h1>
        <motion.p
          className="page-hero-sub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t('exp.page.sub')}
        </motion.p>
        <motion.hr
          className="hero-rule"
          aria-hidden="true"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        />
      </section>

      {/* ── EXPERIENCE ── */}
      <section id="experiencia" className="experience-section" aria-labelledby="expHeading">
        <div className="exp-grid">

          <motion.div
            className="exp-text"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={inView}
          >
            <motion.p className="section-tag" variants={fadeUp}>{t('exp.section.tag')}</motion.p>
            <motion.h2 className="section-headline" id="expHeading" variants={fadeUp}>
              {t('exp.section.h2').split('\n').map((line, i, arr) => (
                i < arr.length - 1 ? <span key={i}>{line}<br /></span> : <span key={i}>{line}</span>
              ))}
            </motion.h2>
            <motion.p variants={fadeUp}>{t('exp.body')}</motion.p>

            <motion.div className="highlights" variants={stagger}>
              <motion.div className="hl-item" variants={fadeUp}>
                <div className="hl-icon"><IconAnchor /></div>
                <div className="hl-text">
                  <strong>{t('exp.hl1.title')}</strong>
                  <span>{t('exp.hl1.sub')}</span>
                </div>
              </motion.div>
              <motion.div className="hl-item" variants={fadeUp}>
                <div className="hl-icon"><IconFish /></div>
                <div className="hl-text">
                  <strong>{t('exp.hl2.title')}</strong>
                  <span>{t('exp.hl2.sub')}</span>
                </div>
              </motion.div>
              <motion.div className="hl-item" variants={fadeUp}>
                <div className="hl-icon"><IconGlass /></div>
                <div className="hl-text">
                  <strong>{t('exp.hl3.title')}</strong>
                  <span>{t('exp.hl3.sub')}</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="exp-image"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={inView}
            transition={{ duration: 0.8 }}
          >
            <img
              src="/images/style.1.png"
              alt="Experiencia Atlantis Charters — cala mediterránea desde el barco"
              loading="lazy"
            />
          </motion.div>

        </div>
      </section>

      {/* ── BOAT ── */}
      <section id="barco" className="boat-section" aria-labelledby="boatHeading">
        <div className="boat-inner">

          <motion.div
            className="boat-header"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={inView}
          >
            <motion.p className="section-tag" variants={fadeUp}>{t('exp.boat.tag')}</motion.p>
            <motion.h2 className="section-headline" id="boatHeading" variants={fadeUp}>
              {t('exp.boat.h2')}
            </motion.h2>
            <motion.p variants={fadeUp}>{t('exp.boat.body')}</motion.p>
          </motion.div>

          <motion.div
            className="specs-row"
            role="list"
            aria-label="Especificaciones del barco"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={inView}
          >
            {[
              { val: '12 m',  lbl: t('exp.spec.1.lbl') },
              { val: '12',    lbl: t('exp.spec.2.lbl') },
              { val: t('exp.spec.3.val'), lbl: t('exp.spec.3.lbl') },
            ].map(s => (
              <motion.div className="spec" key={s.lbl} role="listitem" variants={fadeUp}>
                <span className="spec-val">{s.val}</span>
                <span className="spec-lbl">{s.lbl}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="boat-img-wrap"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inView}
            transition={{ duration: 0.8 }}
          >
            <img
              src="/images/style.2.png"
              alt="Llaut mallorquín Atlantis en el Mediterráneo"
              loading="lazy"
            />
          </motion.div>

        </div>
      </section>

      {/* ── GALLERY ── */}
      <section id="galeria" className="gallery-section" aria-labelledby="galHeading">
        <motion.div
          className="gallery-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.7 }}
        >
          <p className="section-tag">{t('exp.gallery.tag')}</p>
          <h2 className="section-headline" id="galHeading">{t('exp.gallery.h2')}</h2>
        </motion.div>

        <motion.div
          className="gallery-grid"
          role="list"
          aria-label="Galería de fotografías"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
        >
          {[
            { src: '/images/style.3.png', alt: 'Bañada en el Mediterráneo' },
            { src: '/images/style.4.png', alt: 'Atardecer en Mallorca' },
            { src: '/images/style.5.png', alt: 'Aguas turquesas' },
            { src: '/images/style.6.png', alt: 'Vida a bordo' },
            { src: '/images/style.7.png', alt: 'Costa mallorquina' },
            { src: '/images/style.8.png', alt: 'Navegando el Mediterráneo' },
          ].map((img, i) => (
            <motion.div key={i} className="gi" role="listitem" variants={fadeUp}>
              <img src={img.src} alt={img.alt} loading="lazy" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA STRIP ── */}
      <motion.section
        className="cta-strip"
        aria-labelledby="expCtaHeading"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={inView}
        transition={{ duration: 0.7 }}
      >
        <h2 id="expCtaHeading">{t('exp.cta.h2')}</h2>
        <p>{t('exp.cta.body')}</p>
        <div className="cta-buttons">
          <button className="btn-filled" onClick={goReservar}>
            {t('exp.cta.btn')}
          </button>
        </div>
      </motion.section>

      <Footer />
    </motion.div>
  )
}
