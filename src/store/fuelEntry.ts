import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase'

export interface FuelEntry {
  id: string
  date: string // ISO 8601
  odometer: number
  fuelAmount: number
  fuelPrice: number
  createdAt: string
  updatedAt: string
}

export interface CreateFuelEntryInput {
  date: string
  odometer: number
  fuelAmount: number
  fuelPrice: number
}

// Validation function
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

export const useFuelEntryStore = defineStore('fuelEntry', () => {
  const entries = ref<FuelEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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
    cleanup
  }
})
