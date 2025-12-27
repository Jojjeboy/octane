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

describe('Fuel Store Predictions Integration (TDD)', () => {
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

    it('calculates estimated range automatically based on average efficiency', async () => {
        const store = useFuelEntryStore()

        // No entries -> null
        expect(store.estimatedRange).toBeNull()

        // Add entries manually to state for fast testing
        store.entries = sampleEntries

        // Avg Efficiency: 500 distance / 35 fuel = 14.2857...
        // Tank capacity (planned): 50
        // Expected range: 14.2857... * 50 = 714.2857...
        expect(store.estimatedRange).toBeCloseTo(714.2857, 4)
    })

    it('calculates estimated full tank cost correctly', () => {
        const store = useFuelEntryStore()
        store.entries = sampleEntries

        // Avg Cost per distance: (35 * 1.6) / 500 = 0.112 $/km
        // Expected full tank cost: 714.2857 * 0.112 = 80 $
        expect(store.estimatedFullTankCost).toBeCloseTo(80, 2)
    })

    it('updates predictions when entries change', async () => {
        const store = useFuelEntryStore()
        store.entries = sampleEntries
        const initialRange = store.estimatedRange

        // Update second entry's odometer to improve efficiency
        store.entries[1].odometer = 10600
        // New distance: 600. Avg Eff: 600 / 35 = 17.142857...
        // New range: 17.142857... * 50 = 857.142857...

        expect(store.estimatedRange).toBeCloseTo(857.1429, 4)
        expect(store.estimatedRange).not.toBe(initialRange)
    })
})
