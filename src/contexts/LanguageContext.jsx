import { createContext, useContext, useState, useCallback } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)

const LANGUAGES = ['es', 'en', 'de', 'fr']

function getInitialLang() {
  const saved = localStorage.getItem('atlantis-lang')
  if (saved && LANGUAGES.includes(saved)) return saved
  const browser = navigator.language?.split('-')[0]
  if (LANGUAGES.includes(browser)) return browser
  return 'es'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang)

  const changeLang = useCallback((code) => {
    setLang(code)
    localStorage.setItem('atlantis-lang', code)
  }, [])

  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations.es[key] ?? key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
