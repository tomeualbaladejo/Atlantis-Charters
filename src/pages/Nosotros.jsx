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
  show:   { transition: { staggerChildren: 0.13 } },
}
const inView = { once: true, margin: '-80px' }

function IconAnchor() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/>
      <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
    </svg>
  )
}
function IconStar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
    </svg>
  )
}
function IconHeart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  )
}

export default function Nosotros() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const goReservar = () => {
    navigate('/')
    setTimeout(() => document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' }), 150)
  }

  const VALUES = [
    { icon: <IconAnchor />, titleKey: 'nos.val.1.title', bodyKey: 'nos.val.1.body' },
    { icon: <IconStar />,   titleKey: 'nos.val.2.title', bodyKey: 'nos.val.2.body' },
    { icon: <IconHeart />,  titleKey: 'nos.val.3.title', bodyKey: 'nos.val.3.body' },
  ]

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
      <section className="page-hero" aria-labelledby="nosHeading">
        <motion.p
          className="page-hero-tag"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {t('nos.page.tag')}
        </motion.p>
        <motion.h1
          id="nosHeading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          {t('nos.page.h1')}
        </motion.h1>
        <motion.p
          className="page-hero-sub"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t('nos.page.sub')}
        </motion.p>
        <motion.hr
          className="hero-rule"
          aria-hidden="true"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        />
      </section>

      {/* ── STORY ── */}
      <section className="story-section" aria-labelledby="storyHeading">
        <div className="story-grid">

          <motion.div
            className="story-text"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={inView}
          >
            <motion.p className="story-tag" variants={fadeUp}>{t('nos.story.tag')}</motion.p>
            <motion.p
              className="story-body"
              id="storyHeading"
              variants={fadeUp}
              dangerouslySetInnerHTML={{ __html: t('nos.story.1') }}
            />
            <motion.p
              className="story-body"
              variants={fadeUp}
              dangerouslySetInnerHTML={{ __html: t('nos.story.2') }}
            />
            <motion.p
              className="story-body"
              variants={fadeUp}
              dangerouslySetInnerHTML={{ __html: t('nos.story.3') }}
            />
            <motion.div variants={fadeUp}>
              <button className="story-cta" onClick={goReservar}>
                {t('nos.story.cta')}
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            className="story-photos"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={inView}
            transition={{ duration: 0.8 }}
          >
            <div className="captain-photos">
              <div className="captain-photo-wrapper">
                <img
                  src="/images/capitana.png"
                  alt="Feli — Capitana del Atlantis"
                  loading="lazy"
                />
                <span className="captain-caption">Feli · Capitana</span>
              </div>
              <div className="captain-photo-wrapper">
                <img
                  src="/images/capitan.png"
                  alt="Fede — Capitán del Atlantis"
                  loading="lazy"
                />
                <span className="captain-caption">Fede · Capitán</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="values-section" aria-labelledby="valuesHeading">
        <motion.div
          className="values-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.7 }}
        >
          <p className="section-tag">{t('nos.values.tag')}</p>
          <h2 className="section-headline" id="valuesHeading" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
            {t('nos.values.h2')}
          </h2>
        </motion.div>

        <motion.div
          className="values-grid"
          role="list"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
        >
          {VALUES.map((v, i) => (
            <motion.div key={i} className="val-card" role="listitem" variants={fadeUp}>
              <div className="val-icon-wrap" aria-hidden="true">{v.icon}</div>
              <h3 className="val-title">{t(v.titleKey)}</h3>
              <p className="val-body">{t(v.bodyKey)}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CONTACT STRIP ── */}
      <motion.section
        className="nosotros-cta-strip"
        aria-labelledby="nosCtaHeading"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={inView}
        transition={{ duration: 0.7 }}
      >
        <h2 id="nosCtaHeading">{t('nos.cta.h2')}</h2>
        <p>{t('nos.cta.body')}</p>
        <div className="cta-buttons">
          <a
            className="btn-outline-white"
            href="https://wa.me/34611062419"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('nos.cta.wa')}
          </a>
          <a
            className="btn-outline-white"
            href="https://instagram.com/atlantis.charters"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('nos.cta.ig')}
          </a>
          <button className="btn-outline-white" onClick={goReservar}>
            {t('nos.cta.form')}
          </button>
        </div>
      </motion.section>

      <Footer />
    </motion.div>
  )
}
