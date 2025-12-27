import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore'
import { db, auth } from '@/services/firebase'

export interface FuelLog {
  id: string
  date: string
  odometer: number
  liters: number
  pricePerLiter: number
  totalCost: number
  fullTank: boolean
}

export interface Vehicle {
  name: string
  make: string
  model: string
  year: number
  initialOdometer: number
}

export const useVehicleStore = defineStore('vehicle', () => {
  const vehicle = ref<Vehicle | null>(null)
  const fuelLogs = ref<FuelLog[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Unsubscribe functions for real-time listeners
  let unsubscribeVehicle: (() => void) | null = null
  let unsubscribeLogs: (() => void) | null = null

  /**
   * Initialize subscriptions to Firestore.
   * This handles both initial fetch and real-time updates.
   * Thanks to persistence, this works offline too (reading from cache).
   */
  const init = () => {
    const user = auth.currentUser
    if (!user) {
      error.value = 'User not authenticated'
      return
    }

    loading.value = true

    // Reference paths
    const userDocRef = doc(db, 'users', user.uid)
    const vehicleDocRef = doc(userDocRef, 'vehicle', 'data')
    const logsColRef = collection(userDocRef, 'fuelLogs')

    // 1. Subscribe to Vehicle Data
    unsubscribeVehicle = onSnapshot(vehicleDocRef, (docSnap) => {
      if (docSnap.exists()) {
        vehicle.value = docSnap.data() as Vehicle
      } else {
        vehicle.value = null // No vehicle set up yet
      }
      loading.value = false
    }, (err) => {
      console.error('Vehicle sync error:', err)
      error.value = err.message
    })

    // 2. Subscribe to Fuel Logs (ordered by date desc)
    const logsQuery = query(logsColRef, orderBy('date', 'desc'))
    unsubscribeLogs = onSnapshot(logsQuery, (querySnap) => {
      fuelLogs.value = querySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FuelLog[]
    }, (err) => {
      console.error('Fuel logs sync error:', err)
       // Don't overwrite main error if it's just a query issue
    })
  }

  /**
   * Set or Update vehicle details.
   * Merges data effectively acting as create or update.
   */
  const setVehicle = async (data: Vehicle) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const vehicleRef = doc(db, 'users', user.uid, 'vehicle', 'data')
      await setDoc(vehicleRef, { // using setDoc to create or overwrite
        ...data,
        updatedAt: serverTimestamp() // Conflict resolution aid
      }, { merge: true })
      // No need to update state manually, listener handles it
    } catch (err: any) {
      console.error('Error saving vehicle:', err)
      error.value = err.message
      throw err
    }
  }

  /**
   * Add a new fuel log.
   */
  const addFuelLog = async (log: Omit<FuelLog, 'id'>) => {
    const user = auth.currentUser
    if (!user) return

    try {
      await addDoc(collection(db, 'users', user.uid, 'fuelLogs'), {
        ...log,
        createdAt: serverTimestamp()
      })
      // No need to update state manually, listener handles it
    } catch (err: any) {
       console.error('Error adding log:', err)
       error.value = err.message
       throw err
    }
  }

  // Cleanup listeners (e.g. on logout)
  const cleanup = () => {
    if (unsubscribeVehicle) unsubscribeVehicle()
    if (unsubscribeLogs) unsubscribeLogs()
    vehicle.value = null
    fuelLogs.value = []
  }

  return {
    vehicle,
    fuelLogs,
    loading,
    error,
    init,
    cleanup,
    setVehicle,
    addFuelLog,
  }
})
