import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase'
import {
  calculateAverageEfficiency,
  calculatePerEntryEfficiency,
  calculateAverageCostPerDistance
} from '@/domain/fuelCalculations'
import {
  estimateRange,
  estimateFullTankCost
} from '@/domain/fuelPredictions'

export interface FuelEntry {
  id: string
  date: string // ISO 8601
  odometer: number
  fuelAmount: number
  fuelPrice: number
  station?: string
  createdAt: string
  updatedAt: string
}

export interface CreateFuelEntryInput {
  date: string
  odometer: number
  fuelAmount: number
  fuelPrice: number
  station?: string
}

export interface UpdateFuelEntryInput {
  date?: string
  odometer?: number
  fuelAmount?: number
  fuelPrice?: number
  station?: string
}

// Validation function for creation
function validateFuelEntry(input: CreateFuelEntryInput): void {
  if (input.odometer <= 0) {
    throw new Error('Odometer must be positive')
  }
  if (input.fuelAmount <= 0) {
    throw new Error('Fuel amount must be positive')
  }
  if (input.fuelPrice <= 0) {
    throw new Error('Fuel price must be positive')
  }

  const entryDate = new Date(input.date)
  const now = new Date()
  if (entryDate > now) {
    throw new Error('Date cannot be in the future')
  }
}

// Validation function for updates
function validateUpdateData(updates: UpdateFuelEntryInput): void {
  if (updates.odometer !== undefined && updates.odometer <= 0) {
    throw new Error('Odometer must be positive')
  }
  if (updates.fuelAmount !== undefined && updates.fuelAmount <= 0) {
    throw new Error('Fuel amount must be positive')
  }
  if (updates.fuelPrice !== undefined && updates.fuelPrice <= 0) {
    throw new Error('Fuel price must be positive')
  }
  if (updates.date !== undefined) {
    const entryDate = new Date(updates.date)
    const now = new Date()
    if (entryDate > now) {
      throw new Error('Date cannot be in the future')
    }
  }
}

export const useFuelEntryStore = defineStore('fuelEntry', () => {
  const entries = ref<FuelEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Derived metrics (read-only)

  /**
   * Helper to get entries in chronological order (odometer ascending)
   * as the calculation module assumes this order.
   */
  const chronologicalEntries = computed(() => {
    return [...entries.value].sort((a, b) => a.odometer - b.odometer)
  })

  const averageEfficiency = computed(() => {
    try {
      return calculateAverageEfficiency(chronologicalEntries.value)
    } catch (err: any) {
      console.error('Efficiency calculation error:', err.message)
      return null
    }
  })

  const perEntryEfficiency = computed(() => {
    try {
      return calculatePerEntryEfficiency(chronologicalEntries.value)
    } catch (err: any) {
      console.error('Per-entry efficiency calculation error:', err.message)
      return []
    }
  })

  const averageCostPerDistance = computed(() => {
    try {
      return calculateAverageCostPerDistance(chronologicalEntries.value)
    } catch (err: any) {
      console.error('Cost calculation error:', err.message)
      return null
    }
  })

  // Predictions (Read-only estimates)
  const TANK_CAPACITY = 50 // Liters/Gallons - configurable in code

  const estimatedRange = computed(() => {
    try {
      return estimateRange(averageEfficiency.value, TANK_CAPACITY)
    } catch (err: any) {
      console.error('Range estimation error:', err.message)
      return null
    }
  })

  const estimatedFullTankCost = computed(() => {
    try {
      return estimateFullTankCost(
        averageCostPerDistance.value,
        averageEfficiency.value,
        TANK_CAPACITY
      )
    } catch (err: any) {
      console.error('Cost estimation error:', err.message)
      return null
    }
  })

  let unsubscribe: (() => void) | null = null

  /**
   * Initialize real-time listener for fuel entries
   */
  const init = () => {
    const user = auth.currentUser
    if (!user) {
      error.value = 'User not authenticated'
      return
    }

    loading.value = true

    const entriesCol = collection(db, 'users', user.uid, 'fuelEntries')
    const entriesQuery = query(entriesCol, orderBy('date', 'desc'))

    unsubscribe = onSnapshot(entriesQuery, (snapshot) => {
      entries.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FuelEntry[]
      loading.value = false
    }, (err) => {
      console.error('Fuel entries sync error:', err)
      error.value = err.message
      loading.value = false
    })
  }

  /**
   * Create a new fuel entry with validation
   */
  const createEntry = async (input: CreateFuelEntryInput): Promise<void> => {
    // Validate first
    validateFuelEntry(input)

    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }

    const now = new Date().toISOString()
    const newEntry: Omit<FuelEntry, 'id'> = {
      ...input,
      createdAt: now,
      updatedAt: now
    }

    try {
      // Attempt to write to Firebase
      const entriesCol = collection(db, 'users', user.uid, 'fuelEntries')
      const docRef = await addDoc(entriesCol, {
        ...newEntry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Optimistic update: add to local state immediately
      entries.value.unshift({
        id: docRef.id,
        ...newEntry
      })

    } catch (err: any) {
      // If offline, still add to local state
      // Firestore persistence will handle sync when online
      console.warn('Failed to write to Firebase, adding locally:', err.message)

      // Generate temporary ID
      const tempId = `temp-${Date.now()}`
      entries.value.unshift({
        id: tempId,
        ...newEntry
      })
    }
  }

  /**
   * Update an existing fuel entry
   */
  const updateEntry = async (entryId: string, updates: UpdateFuelEntryInput): Promise<void> => {
    // Validate update data
    validateUpdateData(updates)

    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Find the entry in local state
    const entryIndex = entries.value.findIndex(e => e.id === entryId)
    if (entryIndex === -1) {
      throw new Error('Entry not found')
    }

    // Update local state optimistically
    const updatedEntry: FuelEntry = {
      ...entries.value[entryIndex]!,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    entries.value[entryIndex] = updatedEntry

    try {
      // Sync to Firebase
      const entryRef = doc(db, 'users', user.uid, 'fuelEntries', entryId)
      await setDoc(entryRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (err: any) {
      // Offline - Firestore persistence handles queuing
      console.warn('Failed to sync update to Firebase:', err.message)
    }
  }

  /**
   * Delete a fuel entry (hard delete)
   */
  const deleteEntry = async (entryId: string): Promise<void> => {
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Remove from local state immediately (optimistic)
    entries.value = entries.value.filter(e => e.id !== entryId)

    try {
      // Delete from Firebase
      const entryRef = doc(db, 'users', user.uid, 'fuelEntries', entryId)
      await deleteDoc(entryRef)
    } catch (err: any) {
      // Offline - Firestore persistence handles queuing
      console.warn('Failed to delete from Firebase:', err.message)
    }
  }

  /**
   * Cleanup listener
   */
  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
    }
    entries.value = []
  }

  return {
    entries,
    loading,
    error,
    init,
    createEntry,
    updateEntry,
    deleteEntry,
    cleanup,
    // Metrics
    averageEfficiency,
    perEntryEfficiency,
    averageCostPerDistance,
    // Predictions
    estimatedRange,
    estimatedFullTankCost
  }
})
