import { useEffect, useState } from 'react'
import { toLocalDate, type LocalDate } from '../../engine/index.ts'

/**
 * Jour courant de l'appareil, mis à jour à minuit et au retour sur l'application
 * (une PWA peut rester ouverte en arrière-plan plusieurs jours).
 */
export function useToday(now: () => Date): LocalDate {
  const [today, setToday] = useState(() => toLocalDate(now()))

  useEffect(() => {
    const refresh = () => setToday(toLocalDate(now()))
    let timer: ReturnType<typeof setTimeout>
    const scheduleMidnight = () => {
      const current = now()
      const nextDay = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 1)
      timer = setTimeout(() => {
        refresh()
        scheduleMidnight()
      }, nextDay.getTime() - current.getTime())
    }
    scheduleMidnight()
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [now])

  return today
}
