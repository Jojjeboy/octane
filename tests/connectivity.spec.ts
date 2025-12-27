import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initConnectivityTracker, cleanupConnectivityTracker } from '@/services/connectivity'

describe('Connectivity Service', () => {
  let onlineCallback: (() => void) | null = null
  let offlineCallback: (() => void) | null = null

  beforeEach(() => {
    onlineCallback = null
    offlineCallback = null

    // Mock window.addEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'online') onlineCallback = callback as () => void
      if (event === 'offline') offlineCallback = callback as () => void
    })

    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanupConnectivityTracker()
  })

  it('detects initial online status', () => {
    vi.stubGlobal('navigator', { onLine: true })
    const { isOnline } = initConnectivityTracker(() => {})
    expect(isOnline.value).toBe(true)
  })

  it('detects initial offline status', () => {
    vi.stubGlobal('navigator', { onLine: false })
    const { isOnline } = initConnectivityTracker(() => {})
    expect(isOnline.value).toBe(false)
  })

  it('responds to online browser event', () => {
    vi.stubGlobal('navigator', { onLine: false })
    const onChange = vi.fn()
    const { isOnline } = initConnectivityTracker(onChange)

    expect(isOnline.value).toBe(false)

    // Simulate online event
    vi.stubGlobal('navigator', { onLine: true })
    if (onlineCallback) onlineCallback()

    expect(isOnline.value).toBe(true)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('responds to offline browser event', () => {
    vi.stubGlobal('navigator', { onLine: true })
    const onChange = vi.fn()
    const { isOnline } = initConnectivityTracker(onChange)

    expect(isOnline.value).toBe(true)

    // Simulate offline event
    vi.stubGlobal('navigator', { onLine: false })
    if (offlineCallback) offlineCallback()

    expect(isOnline.value).toBe(false)
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
