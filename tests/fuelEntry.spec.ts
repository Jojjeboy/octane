import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFuelEntryStore } from '@/store/fuelEntry'
import type { FuelEntry } from '@/store/fuelEntry'

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-123' }
  },
  db: {}
}))

const mockAddDoc = vi.fn()
const mockOnSnapshot = vi.fn()
const mockCollection = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  serverTimestamp: () => 'TIMESTAMP',
  query: vi.fn(),
  orderBy: vi.fn(),
  doc: vi.fn(),
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
}))

describe('Fuel Entry Domain Model & CRUD (TDD)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockCollection.mockReturnValue('mock-collection-ref')
  })

  describe('Domain Model Validation', () => {
    it('rejects negative odometer values', async () => {
      const store = useFuelEntryStore()
      const invalidEntry = {
        date: '2025-01-01T10:00:00Z',
        odometer: -100,
        fuelAmount: 40,
        fuelPrice: 1.5
      }

      await expect(store.createEntry(invalidEntry)).rejects.toThrow('Odometer must be positive')
    })

    it('rejects negative fuel amounts', async () => {
      const store = useFuelEntryStore()
      const invalidEntry = {
        date: '2025-01-01T10:00:00Z',
        odometer: 10000,
        fuelAmount: -10,
        fuelPrice: 1.5
      }

      await expect(store.createEntry(invalidEntry)).rejects.toThrow('Fuel amount must be positive')
    })

    it('rejects negative fuel prices', async () => {
      const store = useFuelEntryStore()
      const invalidEntry = {
        date: '2025-01-01T10:00:00Z',
        odometer: 10000,
        fuelAmount: 40,
        fuelPrice: -1.5
      }

      await expect(store.createEntry(invalidEntry)).rejects.toThrow('Fuel price must be positive')
    })

    it('rejects future dates', async () => {
      const store = useFuelEntryStore()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const invalidEntry = {
        date: futureDate.toISOString(),
        odometer: 10000,
        fuelAmount: 40,
        fuelPrice: 1.5
      }

      await expect(store.createEntry(invalidEntry)).rejects.toThrow('Date cannot be in the future')
    })
  })

  describe('Offline Creation', () => {
    it('creates fuel entry while offline', async () => {
      const store = useFuelEntryStore()
      const validEntry = {
        date: '2025-01-01T10:00:00Z',
        odometer: 10000,
        fuelAmount: 40,
        fuelPrice: 1.5
      }

      // Simulate offline
      mockAddDoc.mockRejectedValue(new Error('Network error'))

      // Should still succeed locally
      await store.createEntry(validEntry)

      // Entry should be in local state immediately
      expect(store.entries.length).toBe(1)
      expect(store.entries[0].odometer).toBe(10000)
    })

    it('assigns timestamps to new entries', async () => {
      const store = useFuelEntryStore()
      const validEntry = {
        date: '2025-01-01T10:00:00Z',
        odometer: 10000,
        fuelAmount: 40,
        fuelPrice: 1.5
      }

      mockAddDoc.mockResolvedValue({ id: 'test-id' })

      await store.createEntry(validEntry)

      expect(store.entries[0].createdAt).toBeDefined()
      expect(store.entries[0].updatedAt).toBeDefined()
    })
  })

  describe('Firebase Sync', () => {
    it('syncs to Firebase when online', async () => {
      const store = useFuelEntryStore()
      const validEntry = {
        date: '2025-01-01T10:00:00Z',
        odometer: 10000,
        fuelAmount: 40,
        fuelPrice: 1.5
      }

      mockAddDoc.mockResolvedValue({ id: 'firebase-id' })

      await store.createEntry(validEntry)

      // Should call addDoc with correct data
      expect(mockAddDoc).toHaveBeenCalledWith(
        'mock-collection-ref',
        expect.objectContaining({
          date: '2025-01-01T10:00:00Z',
          odometer: 10000,
          fuelAmount: 40,
          fuelPrice: 1.5
        })
      )
    })

    it('initializes real-time listener for entries', () => {
   const store = useFuelEntryStore()
      store.init()

      // Should subscribe to Firestore collection
      expect(mockOnSnapshot).toHaveBeenCalled()
    })
  })

  describe('Reading Entries', () => {
    it('reads entries from cache when offline', () => {
      const store = useFuelEntryStore()

      // Simulate cached data from onSnapshot
      let snapshotCallback: ((snap: any) => void) | null = null
      mockOnSnapshot.mockImplementation((ref, cb) => {
        snapshotCallback = cb
        return vi.fn()
      })

      store.init()

      // Simulate Firestore update
      const mockSnapshot = {
        docs: [
          {
            id: 'entry1',
            data: () => ({
              date: '2025-01-01T10:00:00Z',
              odometer: 10000,
              fuelAmount: 40,
              fuelPrice: 1.5,
              createdAt: 'TIMESTAMP',
              updatedAt: 'TIMESTAMP'
            })
          }
        ]
      }

      if (snapshotCallback) {
        snapshotCallback(mockSnapshot)
      }

      expect(store.entries.length).toBe(1)
      expect(store.entries[0].odometer).toBe(10000)
    })
  })
})
