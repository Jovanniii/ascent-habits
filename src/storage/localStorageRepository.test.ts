import { describe, expect, it } from 'vitest'
import { STORAGE_KEY, StoredDataError, createLocalStorageRepository } from './localStorageRepository.ts'
import { createMemoryRepository } from './memoryRepository.ts'
import { FakeStorage, sampleAppData } from './testing.ts'

describe('createLocalStorageRepository', () => {
  it('renvoie null à la première ouverture', async () => {
    await expect(createLocalStorageRepository(new FakeStorage()).load()).resolves.toBeNull()
  })

  it('enregistre puis relit les données', async () => {
    const storage = new FakeStorage()
    const repository = createLocalStorageRepository(storage)
    const data = sampleAppData()
    await repository.save(data)
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()
    await expect(createLocalStorageRepository(storage).load()).resolves.toEqual(data)
  })

  it('signale des données illisibles sans les effacer', async () => {
    const storage = new FakeStorage()
    storage.setItem(STORAGE_KEY, '{ pas du json')
    const error = await createLocalStorageRepository(storage).load().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(StoredDataError)
    expect((error as StoredDataError).raw).toBe('{ pas du json')
    expect(storage.getItem(STORAGE_KEY)).toBe('{ pas du json')
  })

  it('signale des données invalides avec le détail des anomalies', async () => {
    const storage = new FakeStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...sampleAppData(), habits: 'aucune' }))
    const error = await createLocalStorageRepository(storage).load().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(StoredDataError)
    expect((error as StoredDataError).issues).toContain('habits : liste attendue')
  })

  it('accepte une autre clé de stockage', async () => {
    const storage = new FakeStorage()
    await createLocalStorageRepository(storage, 'autre').save(sampleAppData())
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(storage.getItem('autre')).not.toBeNull()
  })
})

describe('createMemoryRepository', () => {
  it('isole les données enregistrées des modifications ultérieures', async () => {
    const repository = createMemoryRepository()
    await expect(repository.load()).resolves.toBeNull()
    const data = sampleAppData()
    await repository.save(data)
    data.habits.pop()
    const loaded = await repository.load()
    expect(loaded?.habits).toHaveLength(2)
  })
})
