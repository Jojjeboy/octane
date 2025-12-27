import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSyncStore } from '@/store/sync'

describe('Sync Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default state', () => {
    const store = useSyncStore()
    expect(store.isOnline).toBe(true)
    expect(store.status).toBe('synced')
  })

  it('updates online status', () => {
    const store = useSyncStore()
    store.setOnline(false)
    expect(store.isOnline).toBe(false)
    expect(store.status).toBe('offline')
  })

  it('transitions through sync states', () => {
    const store = useSyncStore()

    // Start pending
    store.setPending(true)
    expect(store.status).toBe('pending')

    // Start syncing
    store.setSyncing(true)
    expect(store.status).toBe('syncing')

    // Finish syncing, but still pending other writes
    store.setSyncing(false)
    expect(store.status).toBe('pending')

    // All done
    store.setPending(false)
    expect(store.status).toBe('synced')
  })

  it('handles error state', () => {
    const store = useSyncStore()
    store.setError('Sync failed')
    expect(store.status).toBe('error')
    expect(store.errorMessage).toBe('Sync failed')

    // Clearing error returns to synced (or whatever state is appropriate)
    store.setError(null)
    expect(store.status).toBe('synced')
  })

  it('offline status overrides other states', () => {
    const store = useSyncStore()
    store.setPending(true)
    store.setOnline(false)
    expect(store.status).toBe('offline')
  })
})
