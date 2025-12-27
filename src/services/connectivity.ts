import { ref } from 'vue'

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

let onChangeCallback: ((status: boolean) => void) | null = null

const handleOnline = () => {
  isOnline.value = true
  if (onChangeCallback) onChangeCallback(true)
}

const handleOffline = () => {
  isOnline.value = false
  if (onChangeCallback) onChangeCallback(false)
}

/**
 * Initializes listeners for browser online/offline events.
 *
 * @param onStatusChange - Optional callback when connectivity changes
 * @returns Object containing the reactive isOnline ref
 */
export function initConnectivityTracker(onStatusChange?: (status: boolean) => void) {
  onChangeCallback = onStatusChange || null

  if (typeof navigator !== 'undefined') {
    isOnline.value = navigator.onLine
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  return { isOnline }
}

/**
 * Removes event listeners.
 */
export function cleanupConnectivityTracker() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
  onChangeCallback = null
}
