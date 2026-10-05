// @vitest-environment jsdom
import { reducedMotion } from '../testing/setup.ts'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMotionAllowed } from './useMotionAllowed.ts'

describe('useMotionAllowed', () => {
  it('suit le réglage de l’application', () => {
    expect(renderHook(() => useMotionAllowed(true)).result.current).toEqual({ allowed: true, systemReduced: false })
    expect(renderHook(() => useMotionAllowed(false)).result.current.allowed).toBe(false)
  })

  it('suit en direct le réglage « réduire les animations » de l’appareil', () => {
    const { result } = renderHook(() => useMotionAllowed(true))
    act(() => reducedMotion.set(true))
    expect(result.current).toEqual({ allowed: false, systemReduced: true })
    act(() => reducedMotion.set(false))
    expect(result.current.allowed).toBe(true)
  })
})
