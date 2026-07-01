export interface RideBase {
  id: number
  status: string
  pickupLocation: string
  dropLocation: string
  scheduledDate: string
  scheduledTime: string
  passengers: number
  mergeGroupId?: string
  customer: { name: string }
  assignment?: { driver?: { id: number }; vehicle?: { vehicleNumber: string; model?: string } } | null
}

/**
 * Returns a string key that uniquely identifies the group a ride belongs to.
 * - Admin-merged rides: keyed by mergeGroupId
 * - Customer shared rides: keyed by same driver + route + schedule
 * - Unassigned rides (no driver): always their own solo card
 */
export function groupKey(r: RideBase): string {
  if (r.mergeGroupId) return `merge:${r.mergeGroupId}`
  const driverId = r.assignment?.driver?.id
  if (!driverId) return `solo:${r.id}`
  return `shared:${r.pickupLocation}|${r.dropLocation}|${r.scheduledDate}|${r.scheduledTime}|${driverId}|${r.status}`
}

/**
 * Groups an array of rides using groupKey. Preserves order (first occurrence of each key).
 */
export function buildGroups<T extends RideBase>(rides: T[]): T[][] {
  const groups: T[][] = []
  const seen = new Set<number>()
  for (const ride of rides) {
    if (seen.has(ride.id)) continue
    const key = groupKey(ride)
    const group = rides.filter(r => groupKey(r) === key)
    group.forEach(r => seen.add(r.id))
    groups.push(group)
  }
  return groups
}
