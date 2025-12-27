import { describe, it, expect } from 'vitest'
import {
  calculateAverageEfficiency,
  calculatePerEntryEfficiency,
  calculateAverageCostPerDistance,
  type FuelEntryCalculation
} from '@/domain/fuelCalculations'

describe('Fuel Calculations (Pure Domain Logic)', () => {
  const sampleEntries: FuelEntryCalculation[] = [
    {
      id: '1',
      date: '2025-01-01T10:00:00Z',
      odometer: 10000,
      fuelAmount: 40,
      fuelPrice: 1.5
    },
    {
      id: '2',
      date: '2025-01-05T10:00:00Z',
      odometer: 10500,
      fuelAmount: 35,
      fuelPrice: 1.6
    },
    {
      id: '3',
      date: '2025-01-10T10:00:00Z',
      odometer: 11000,
      fuelAmount: 38,
      fuelPrice: 1.55
    }
  ]

  describe('calculateAverageEfficiency', () => {
    it('calculates average efficiency correctly', () => {
      // Total distance: (10500-10000) + (11000-10500) = 1000 km
      // Total fuel: 35 + 38 = 73 L (excluding first fill-up)
      // Efficiency: 1000 / 73 ≈ 13.7 km/L
      const result = calculateAverageEfficiency(sampleEntries)
      expect(result).toBeCloseTo(13.7, 1)
    })

    it('returns null for fewer than 2 entries', () => {
      const result = calculateAverageEfficiency([sampleEntries[0]])
      expect(result).toBeNull()
    })

    it('returns null for empty array', () => {
      const result = calculateAverageEfficiency([])
      expect(result).toBeNull()
    })

    it('throws error for non-monotonic odometer readings', () => {
      const badEntries: FuelEntryCalculation[] = [
        { id: '1', date: '2025-01-01', odometer: 10000, fuelAmount: 40, fuelPrice: 1.5 },
        { id: '2', date: '2025-01-02', odometer: 9000, fuelAmount: 35, fuelPrice: 1.6 }
      ]
      expect(() => calculateAverageEfficiency(badEntries)).toThrow('Odometer readings must be monotonically increasing')
    })

    it('throws error for zero fuel amount', () => {
      const badEntries: FuelEntryCalculation[] = [
        { id: '1', date: '2025-01-01', odometer: 10000, fuelAmount: 40, fuelPrice: 1.5 },
        { id: '2', date: '2025-01-02', odometer: 10500, fuelAmount: 0, fuelPrice: 1.6 }
      ]
      expect(() => calculateAverageEfficiency(badEntries)).toThrow('Fuel amount must be positive')
    })

    it('is deterministic for identical inputs', () => {
      const result1 = calculateAverageEfficiency(sampleEntries)
      const result2 = calculateAverageEfficiency(sampleEntries)
      expect(result1).toBe(result2)
    })

    it('does not mutate input array', () => {
      const entriesCopy = JSON.parse(JSON.stringify(sampleEntries))
      calculateAverageEfficiency(sampleEntries)
      expect(sampleEntries).toEqual(entriesCopy)
    })
  })

  describe('calculatePerEntryEfficiency', () => {
    it('calculates efficiency for each entry except first', () => {
      // Entry 2: (10500-10000) / 35 = 14.29 km/L
      // Entry 3: (11000-10500) / 38 = 13.16 km/L
      const results = calculatePerEntryEfficiency(sampleEntries)

      expect(results).toHaveLength(2)
      expect(results[0].entryId).toBe('2')
      expect(results[0].efficiency).toBeCloseTo(14.29, 2)
      expect(results[1].entryId).toBe('3')
      expect(results[1].efficiency).toBeCloseTo(13.16, 2)
    })

    it('returns empty array for fewer than 2 entries', () => {
      const result = calculatePerEntryEfficiency([sampleEntries[0]])
      expect(result).toEqual([])
    })

    it('returns empty array for empty input', () => {
      const result = calculatePerEntryEfficiency([])
      expect(result).toEqual([])
    })

    it('throws error for non-monotonic odometer', () => {
      const badEntries: FuelEntryCalculation[] = [
        { id: '1', date: '2025-01-01', odometer: 10000, fuelAmount: 40, fuelPrice: 1.5 },
        { id: '2', date: '2025-01-02', odometer: 9500, fuelAmount: 35, fuelPrice: 1.6 }
      ]
      expect(() => calculatePerEntryEfficiency(badEntries)).toThrow('Odometer readings must be monotonically increasing')
    })
  })

  describe('calculateAverageCostPerDistance', () => {
    it('calculates average cost per distance correctly', () => {
      // Total cost: (35 * 1.6) + (38 * 1.55) = 56 + 58.9 = 114.9
      // Total distance: 1000 km
      // Cost per km: 114.9 / 1000 = 0.1149
      const result = calculateAverageCostPerDistance(sampleEntries)
      expect(result).toBeCloseTo(0.1149, 4)
    })

    it('returns null for fewer than 2 entries', () => {
      const result = calculateAverageCostPerDistance([sampleEntries[0]])
      expect(result).toBeNull()
    })

    it('returns null for empty array', () => {
      const result = calculateAverageCostPerDistance([])
      expect(result).toBeNull()
    })

    it('throws error for non-monotonic odometer', () => {
      const badEntries: FuelEntryCalculation[] = [
        { id: '1', date: '2025-01-01', odometer: 10000, fuelAmount: 40, fuelPrice: 1.5 },
        { id: '2', date: '2025-01-02', odometer: 9000, fuelAmount: 35, fuelPrice: 1.6 }
      ]
      expect(() => calculateAverageCostPerDistance(badEntries)).toThrow('Odometer readings must be monotonically increasing')
    })

    it('is deterministic', () => {
      const result1 = calculateAverageCostPerDistance(sampleEntries)
      const result2 = calculateAverageCostPerDistance(sampleEntries)
      expect(result1).toBe(result2)
    })
  })
})
