import { describe, it, expect } from 'vitest'
import { estimateRange, estimateFullTankCost } from '@/domain/fuelPredictions'

describe('Fuel Predictions Domain Logic', () => {
  describe('estimateRange', () => {
    it('calculates range correctly for valid inputs', () => {
      // 15 km/L * 50 L = 750 km
      expect(estimateRange(15, 50)).toBe(750)
      // 10 km/L * 40 L = 400 km
      expect(estimateRange(10, 40)).toBe(400)
    })

    it('returns null if averageEfficiency is null', () => {
      expect(estimateRange(null, 50)).toBeNull()
    })

    it('throws error for invalid tank capacity', () => {
      expect(() => estimateRange(15, 0)).toThrow('Tank capacity must be positive')
      expect(() => estimateRange(15, -1)).toThrow('Tank capacity must be positive')
    })

    it('returns 0 if averageEfficiency is 0', () => {
      expect(estimateRange(0, 50)).toBe(0)
    })
  })

  describe('estimateFullTankCost', () => {
    it('calculates full tank cost correctly', () => {
      // Range: 15 km/L * 50 L = 750 km
      // Cost: 750 km * 0.1 $/km = 75 $
      expect(estimateFullTankCost(0.1, 15, 50)).toBeCloseTo(75, 2)
    })

    it('returns null if metrics are missing', () => {
      expect(estimateFullTankCost(null, 15, 50)).toBeNull()
      expect(estimateFullTankCost(0.1, null, 50)).toBeNull()
    })

    it('throws error for invalid tank capacity', () => {
        expect(() => estimateFullTankCost(0.1, 15, 0)).toThrow('Tank capacity must be positive')
    })
  })
})
