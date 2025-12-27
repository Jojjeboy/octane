/**
 * Pure domain calculation module for fuel efficiency and cost metrics.
 *
 * All functions are pure (no side effects, no I/O, no mutations).
 * Functions are unit-agnostic - works with any consistent unit system.
 *
 * Assumptions:
 * - Entries are ordered chronologically by odometer reading
 * - Distance unit and fuel unit are consistent across all entries
 * - First entry represents initial fill-up (baseline, not used in efficiency calcs)
 */

export interface FuelEntryCalculation {
  id: string
  date: string
  odometer: number
  fuelAmount: number
  fuelPrice: number
}

export interface PerEntryEfficiencyResult {
  entryId: string
  efficiency: number
  distance: number
  fuelUsed: number
}

/**
 * Validates that odometer readings are monotonically increasing.
 * @throws Error if readings decrease or stay the same
 */
function validateMonotonicOdometer(entries: readonly FuelEntryCalculation[]): void {
  for (let i = 1; i < entries.length; i++) {
    if (entries[i]!.odometer <= entries[i - 1]!.odometer) {
      throw new Error('Odometer readings must be monotonically increasing')
    }
  }
}

/**
 * Validates that all fuel amounts are positive.
 * @throws Error if any fuel amount is zero or negative
 */
function validateFuelAmounts(entries: readonly FuelEntryCalculation[]): void {
  for (const entry of entries) {
    if (entry.fuelAmount <= 0) {
      throw new Error('Fuel amount must be positive')
    }
  }
}

/**
 * Calculate average fuel efficiency across all entries.
 *
 * Formula: Total distance traveled / Total fuel consumed
 *
 * Note: First entry is excluded from fuel consumption (baseline fill-up).
 *
 * @param entries - Array of fuel entries (must be chronologically ordered)
 * @returns Average efficiency (distance/fuel unit), or null if insufficient data
 * @throws Error if odometer readings are not monotonic or fuel amounts invalid
 */
export function calculateAverageEfficiency(
  entries: readonly FuelEntryCalculation[]
): number | null {
  if (entries.length < 2) {
    return null
  }

  validateMonotonicOdometer(entries)
  validateFuelAmounts(entries)

  const totalDistance = entries[entries.length - 1]!.odometer - entries[0]!.odometer

  // Sum fuel from 2nd entry onwards (1st is baseline)
  const totalFuel = entries.slice(1).reduce((sum, entry) => sum + entry.fuelAmount, 0)

  return totalDistance / totalFuel
}

/**
 * Calculate fuel efficiency for each individual fuel entry.
 *
 * For each entry (except the first), calculates:
 * - Distance since previous entry
 * - Efficiency = distance / fuel amount
 *
 * @param entries - Array of fuel entries (must be chronologically ordered)
 * @returns Array of per-entry efficiency results, or empty array if insufficient data
 * @throws Error if odometer readings are not monotonic or fuel amounts invalid
 */
export function calculatePerEntryEfficiency(
  entries: readonly FuelEntryCalculation[]
): PerEntryEfficiencyResult[] {
  if (entries.length < 2) {
    return []
  }

  validateMonotonicOdometer(entries)
  validateFuelAmounts(entries)

  const results: PerEntryEfficiencyResult[] = []

  for (let i = 1; i < entries.length; i++) {
    const prevEntry = entries[i - 1]!
    const currEntry = entries[i]!
    const distance = currEntry.odometer - prevEntry.odometer
    const fuelUsed = currEntry.fuelAmount
    const efficiency = distance / fuelUsed

    results.push({
      entryId: currEntry.id,
      efficiency,
      distance,
      fuelUsed
    })
  }

  return results
}

/**
 * Calculate average cost per unit distance.
 *
 * Formula: Total fuel cost / Total distance traveled
 *
 * Note: First entry is excluded from cost calculation (baseline fill-up).
 *
 * @param entries - Array of fuel entries (must be chronologically ordered)
 * @returns Average cost per distance unit, or null if insufficient data
 * @throws Error if odometer readings are not monotonic or fuel amounts invalid
 */
export function calculateAverageCostPerDistance(
  entries: readonly FuelEntryCalculation[]
): number | null {
  if (entries.length < 2) {
    return null
  }

  validateMonotonicOdometer(entries)
  validateFuelAmounts(entries)

  const totalDistance = entries[entries.length - 1]!.odometer - entries[0]!.odometer

  // Sum cost from 2nd entry onwards (1st is baseline)
  const totalCost = entries.slice(1).reduce(
    (sum, entry) => sum + (entry.fuelAmount * entry.fuelPrice),
    0
  )

  return totalCost / totalDistance
}
