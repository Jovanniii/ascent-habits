// @vitest-environment jsdom
import '../testing/setup.ts'
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAmbiance } from './useAmbiance.ts'

afterEach(() => {
  vi.useRealTimers()
})

describe('useAmbiance', () => {
  it('passe au moment suivant à l’heure prévue, sans interroger l’heure en boucle', () => {
    vi.useFakeTimers()
    let current = new Date(2026, 9, 7, 17, 59, 30)
    const now = () => current
    const { result } = renderHook(() => useAmbiance(now))
    expect(result.current.period).toBe('day')

    current = new Date(2026, 9, 7, 18, 0, 31)
    act(() => {
      vi.advanceTimersByTime(61_000)
    })
    expect(result.current.period).toBe('evening')
    // Un seul minuteur en attente : le prochain changement (21 h).
    expect(vi.getTimerCount()).toBe(1)
  })

  it('se recalcule au retour sur l’application', () => {
    let current = new Date(2026, 9, 7, 9, 0)
    const { result } = renderHook(() => useAmbiance(() => current))
    expect(result.current.period).toBe('morning')
    current = new Date(2026, 9, 7, 23, 0)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.period).toBe('night')
  })

  it('applique un moment fixé et le garde quelle que soit l’heure', () => {
    vi.useFakeTimers()
    const stored = new Map<string, string>()
    const storage = { getItem: (k: string) => stored.get(k) ?? null, setItem: (k: string, v: string) => void stored.set(k, v) }
    const { result } = renderHook(() => useAmbiance(() => new Date(2026, 9, 7, 12, 0), storage))
    act(() => result.current.setMode('night'))
    expect(result.current).toMatchObject({ mode: 'night', period: 'night' })
    expect(stored.get('ascent:ambiance')).toBe('night')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reste utilisable si le stockage de l’appareil est inaccessible', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqué')
      },
      setItem: () => {
        throw new Error('bloqué')
      },
    }
    const { result } = renderHook(() => useAmbiance(() => new Date(2026, 9, 7, 12, 0), broken))
    expect(result.current.mode).toBe('auto')
    act(() => result.current.setMode('day'))
    expect(result.current.mode).toBe('day')
  })
})
