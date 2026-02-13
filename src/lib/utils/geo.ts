import { DEFAULT_SEARCH_RADIUS_METERS, FUZZY_LOCATION_OFFSET_METERS } from '@/types'

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// Check if a point is within a radius
export function isWithinRadius(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number = DEFAULT_SEARCH_RADIUS_METERS
): boolean {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng)
  return distance <= radiusMeters
}

// Generate fuzzy location (randomized offset for privacy)
export function generateFuzzyLocation(
  actualLat: number,
  actualLng: number,
  offsetMeters: number = FUZZY_LOCATION_OFFSET_METERS
): { latitude: number; longitude: number; radiusMeters: number } {
  // Generate random offset within a circle
  const randomAngle = Math.random() * 2 * Math.PI
  const randomDistance = Math.random() * offsetMeters

  const latOffset = (randomDistance * Math.cos(randomAngle)) / 111320 // meters to degrees
  const lngOffset =
    (randomDistance * Math.sin(randomAngle)) / (111320 * Math.cos((actualLat * Math.PI) / 180))

  return {
    latitude: actualLat + latOffset,
    longitude: actualLng + lngOffset,
    radiusMeters: offsetMeters,
  }
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

// Get current user location (browser API)
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
      }
    )
  })
}
