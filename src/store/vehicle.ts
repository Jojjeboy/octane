import { ref } from 'vue'
import { defineStore } from 'pinia'

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
  // Single vehicle state - explicitly not an array
  const vehicle = ref<Vehicle | null>(null)
  const fuelLogs = ref<FuelLog[]>([])

  const setVehicle = (data: Vehicle) => {
    vehicle.value = data
  }

  const addFuelLog = (log: FuelLog) => {
    fuelLogs.value.push(log)
  }

  return {
    vehicle,
    fuelLogs,
    setVehicle,
    addFuelLog,
  }
})
