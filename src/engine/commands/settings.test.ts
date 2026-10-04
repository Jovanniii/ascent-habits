import { describe, expect, it } from 'vitest'
import { makeAppData } from '../testing/factories.ts'
import { updateSettings } from './settings.ts'

describe('updateSettings', () => {
  it('modifie uniquement les réglages fournis', () => {
    const data = updateSettings(makeAppData(), { animationsEnabled: false })
    expect(data.settings).toEqual({ themeId: 'plain', animationsEnabled: false })
  })
})
