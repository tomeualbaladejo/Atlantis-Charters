import { createContext, useContext, useState } from 'react'

const BookingContext = createContext()

export function useBooking() {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider')
  }
  return context
}

export function BookingProvider({ children }) {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [initialSession, setInitialSession] = useState('')

  const openBooking = (session = '') => {
    setInitialSession(session)
    setBookingOpen(true)
  }

  const closeBooking = () => {
    setBookingOpen(false)
    setInitialSession('')
  }

  return (
    <BookingContext.Provider value={{
      bookingOpen,
      initialSession,
      openBooking,
      closeBooking,
    }}>
      {children}
    </BookingContext.Provider>
  )
}
