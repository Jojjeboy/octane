import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type SyncStatus = 'offline' | 'pending' | 'syncing' | 'synced' | 'error'

export const useSyncStore = defineStore('sync', () => {
  const isOnline = ref(true)
  const isPending = ref(false)
  const isSyncing = ref(false)
  const errorMessage = ref<string | null>(null)

  const status = computed((): SyncStatus => {
    if (!isOnline.value) return 'offline'
    if (errorMessage.value) return 'error'
    if (isSyncing.value) return 'syncing'
    if (isPending.value) return 'pending'
    return 'synced'
  })

  function setOnline(value: boolean) {
    isOnline.value = value
  }

  function setPending(value: boolean) {
    isPending.value = value
  }

  function setSyncing(value: boolean) {
    isSyncing.value = value
  }

  function setError(message: string | null) {
    errorMessage.value = message
  }

  return {
    isOnline,
    status,
    errorMessage,
    setOnline,
    setPending,
    setSyncing,
    setError
  }
})
