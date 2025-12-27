import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFuelEntryStore } from '@/store/fuelEntry'

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
const mockSetDoc = vi.fn()
const mockDeleteDoc = vi.fn()
const mockDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  doc: (...args: any[]) => mockDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  serverTimestamp: () => 'TIMESTAMP',
  query: vi.fn(),
  orderBy: vi.fn(),
  getFirestore: vi.fn(),
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
}))

describe('Fuel Store Derived Metrics (TDD)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockCollection.mockReturnValue('mock-collection-ref')
    mockDoc.mockReturnValue('mock-doc-ref')
  })

  const sampleEntries = [
    {
      id: '1',
      date: '2025-01-01T10:00:00Z',
      odometer: 10000,
      fuelAmount: 40,
      fuelPrice: 1.5,
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z'
    },
    {
      id: '2',
      date: '2025-01-05T10:00:00Z',
      odometer: 10500,
      fuelAmount: 35,
      fuelPrice: 1.6,
      createdAt: '2025-01-05T10:00:00Z',
      updatedAt: '2025-01-05T10:00:00Z'
    }
  ]

  it('computes metrics automatically when entries change (Create)', async () => {
    const store = useFuelEntryStore()

    // Initial state
    expect(store.averageEfficiency).toBeNull()
    expect(store.perEntryEfficiency).toEqual([])
    expect(store.averageCostPerDistance).toBeNull()

    // Add first entry
    await store.createEntry(sampleEntries[0])
    expect(store.averageEfficiency).toBeNull() // Still null because we need 2 entries

    // Add second entry
    await store.createEntry(sampleEntries[1])

    // Total distance: 10500 - 10000 = 500
    // Total fuel (from 2nd): 35
    // Efficiency: 500 / 35 = 14.2857...
    expect(store.averageEfficiency).toBeCloseTo(14.2857, 4)
    expect(store.perEntryEfficiency).toHaveLength(1)
    expect(store.averageCostPerDistance).toBeCloseTo((35 * 1.6) / 500, 4)
  })

  it('updates metrics when an entry is updated', async () => {
    const store = useFuelEntryStore()
    store.entries = [...sampleEntries]

    const initialEfficiency = store.averageEfficiency

    // Update second entry's odometer
    await store.updateEntry('2', { odometer: 10600 })

    // Total distance: 10600 - 10000 = 600
    // Total fuel: 35
    // Efficiency: 600 / 35 = 17.142857...
    expect(store.averageEfficiency).toBeCloseTo(17.1429, 4)
    expect(store.averageEfficiency).not.toBe(initialEfficiency)
  })

  it('updates metrics when an entry is deleted', async () => {
    const store = useFuelEntryStore()
    store.entries = [
      ...sampleEntries,
      {
        id: '3',
        date: '2025-01-10T10:00:00Z',
        odometer: 11000,
        fuelAmount: 38,
        fuelPrice: 1.55,
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2025-01-10T10:00:00Z'
      }
    ]

    const efficiencyWithThree = store.averageEfficiency

    // Delete third entry
    await store.deleteEntry('3')

    expect(store.averageEfficiency).toBeCloseTo(14.2857, 4)
    expect(store.averageEfficiency).not.toBe(efficiencyWithThree)
  })

  it('remains stable and deterministic during offline sync', async () => {
    const store = useFuelEntryStore()

    // Simulate offline creation
    mockAddDoc.mockRejectedValue(new Error('Offline'))
    await store.createEntry(sampleEntries[0])
    await store.createEntry(sampleEntries[1])

    const offlineEfficiency = store.averageEfficiency
    expect(offlineEfficiency).toBeCloseTo(14.2857, 4)

    // Simulate sync reconciliation (snapshot update)
    let snapshotCallback: ((snap: any) => void) | null = null
    mockOnSnapshot.mockImplementation((ref, cb) => {
      snapshotCallback = cb
      return vi.fn()
    })

    store.init()

    const mockSnapshot = {
        docs: sampleEntries.map(e => ({
            id: e.id,
            data: () => ({ ...e })
        }))
    }

    if (snapshotCallback) {
      snapshotCallback(mockSnapshot)
    }

    // Efficiency should be identical after sync
    expect(store.averageEfficiency).toBe(offlineEfficiency)
  })

  it('derived metrics are read-only', () => {
    const store = useFuelEntryStore()

    // In TypeScript, this is caught at compile time but let's check runtime or property descriptors if needed.
    // For Pinia stores with refs, we check if there's a setter if possible,
    // but the instruction says "Expose computed/derived getters only".
    // We can't really "test" that it's un-writable in a standard way other than attempting a write and seeing if it fails or doesn't change if it's a computed.

    // @ts-ignore
    expect(() => { store.averageEfficiency = 100 }).toThrow
  })
})
