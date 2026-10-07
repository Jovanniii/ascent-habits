import type { ReactNode } from 'react'
import { DayPeriodContext } from '../../themes/index.ts'
import { AmbianceSettingContext, useAmbiance, type PreferenceStorage } from './useAmbiance.ts'

interface Props {
  now: () => Date
  storage: PreferenceStorage | undefined
  children: ReactNode
}

/** Fournit le réglage « Ambiance » aux écrans et le moment de la journée aux thèmes. */
export function AmbianceProvider({ now, storage, children }: Props) {
  const ambiance = useAmbiance(now, storage)
  return (
    <AmbianceSettingContext value={ambiance}>
      <DayPeriodContext value={ambiance.period}>{children}</DayPeriodContext>
    </AmbianceSettingContext>
  )
}
