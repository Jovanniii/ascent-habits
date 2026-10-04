import { describe, expect, it, vi } from 'vitest'
import { requestPersistentStorage } from './persistence.ts'

function manager(persisted: boolean, persist: boolean | Error): StorageManager {
  return {
    persisted: vi.fn(async () => persisted),
    persist: vi.fn(async () => {
      if (persist instanceof Error) throw persist
      return persist
    }),
  } as unknown as StorageManager
}

describe('requestPersistentStorage', () => {
  it('ne redemande pas si le stockage est déjà persistant', async () => {
    const storage = manager(true, false)
    await expect(requestPersistentStorage(storage)).resolves.toBe(true)
    expect(storage.persist).not.toHaveBeenCalled()
  })

  it('demande la persistance sinon', async () => {
    await expect(requestPersistentStorage(manager(false, true))).resolves.toBe(true)
  })

  it("renvoie false si l'API est absente ou échoue", async () => {
    await expect(requestPersistentStorage(undefined)).resolves.toBe(false)
    await expect(requestPersistentStorage(manager(false, new Error('refus')))).resolves.toBe(false)
  })
})
