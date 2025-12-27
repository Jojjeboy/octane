/**
 * Pure domain module for predictive fuel calculations.
 *
 * All functions are pure and side-effect free.
 */

/**
 * Estimates remaining driving range based on efficiency and tank capacity.
 *
 * @param averageEfficiency - The average efficiency (e.g., km/L or MPG)
 * @param tankCapacity - The total capacity of the fuel tank (e.g., Liters or Gallons)
 * @returns Estimated range, or null if efficiency is missing
 * @throws Error if tank capacity is not positive
 */
export function estimateRange(
    averageEfficiency: number | null,
    tankCapacity: number
): number | null {
    if (tankCapacity <= 0) {
        throw new Error('Tank capacity must be positive')
    }

    if (averageEfficiency === null) {
        return null
    }

    return averageEfficiency * tankCapacity
}

/**
 * Estimates the cost to fill a tank and drive its full range.
 *
 * @param averageCostPerDistance - The average cost per distance unit (e.g., $/km)
 * @param averageEfficiency - The average efficiency
 * @param tankCapacity - Total tank capacity
 * @returns Estimated cost for a full tank, or null if metrics missing
 */
export function estimateFullTankCost(
    averageCostPerDistance: number | null,
    averageEfficiency: number | null,
    tankCapacity: number
): number | null {
    const range = estimateRange(averageEfficiency, tankCapacity)

    if (range === null || averageCostPerDistance === null) {
        return null
    }

    return range * averageCostPerDistance
}
