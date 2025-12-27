import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVehicleStore } from '@/store/vehicle'
import { auth } from '@/services/firebase'

// Mock Firebase services
vi.mock('@/services/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-123' }
  },
  db: {}
}))

// Mock Firestore
const mockOnSnapshot = vi.fn()
const mockSetDoc = vi.fn()
const mockAddDoc = vi.fn()
const mockDoc = vi.fn()
const mockCollection = vi.fn()

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  serverTimestamp: () => 'TIMESTAMP',
  query: vi.fn(),
  orderBy: vi.fn(),
  updateDoc: vi.fn(),
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
}))

describe('Vehicle Store Persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Default mocks
    mockDoc.mockReturnValue('mock-doc-ref')
    mockCollection.mockReturnValue('mock-col-ref')
  })

  it('initializes listeners when authorized', () => {
    const store = useVehicleStore()
    store.init()

    // Should call onSnapshot twice (vehicle + logs)
    expect(mockOnSnapshot).toHaveBeenCalledTimes(2)
  })

  it('updates vehicle data via setDoc', async () => {
    const store = useVehicleStore()
    const vehicleData = {
      name: 'My Car',
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      initialOdometer: 10000
    }

    await store.setVehicle(vehicleData)

    expect(mockSetDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({ ...vehicleData, updatedAt: 'TIMESTAMP' }),
      { merge: true }
    )
  })

  it('adds fuel log via addDoc', async () => {
    const store = useVehicleStore()
    const logData = {
      date: '2025-01-01',
      odometer: 10500,
      liters: 40,
      pricePerLiter: 1.5,
      totalCost: 60,
      fullTank: true
    }

    await store.addFuelLog(logData)

    expect(mockAddDoc).toHaveBeenCalledWith(
      'mock-col-ref',
      expect.objectContaining({ ...logData, createdAt: 'TIMESTAMP' })
    )
  })

  it('updates state when onSnapshot fires', () => {
    const store = useVehicleStore()

    // Capture the callback passed to onSnapshot (first call is vehicle)
    let vehicleCallback: ((snap: any) => void) | null = null
    let callCount = 0
    mockOnSnapshot.mockImplementation((ref, cb) => {
      if (callCount === 0) {
        vehicleCallback = cb
      }
      callCount++
      return vi.fn() // unsubscribe
    })

    store.init()

    // Simulate Firestore update
    const mockSnap = {
      exists: () => true,
      data: () => ({ name: 'Synced Car', make: 'Ford' }),
      metadata: { hasPendingWrites: false }
    }

    if (vehicleCallback) {
      vehicleCallback(mockSnap)
    }

    expect(store.vehicle).toEqual({ name: 'Synced Car', make: 'Ford' })
  })
})
