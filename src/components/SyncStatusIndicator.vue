<script setup lang="ts">
import { useSyncStore } from '@/store/sync'
import { computed } from 'vue'

const syncStore = useSyncStore()

const statusText = computed(() => {
  switch (syncStore.status) {
    case 'offline': return 'Offline'
    case 'pending': return 'Changes pending'
    case 'syncing': return 'Syncing...'
    case 'error': return 'Sync error'
    case 'synced': return 'Synced'
    default: return ''
  }
})

const statusClass = computed(() => `status-${syncStore.status}`)
</script>

<template>
  <div class="sync-status-indicator" :class="statusClass" title="Synchronization status">
    <span class="dot"></span>
    <span class="text">{{ statusText }}</span>
  </div>
</template>

<style scoped>
.sync-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #f0f0f0;
  color: #666;
  transition: all 0.3s ease;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

/* Status variants */
.status-offline { background: #fee2e2; color: #991b1b; }
.status-offline .dot { background: #ef4444; }

.status-pending { background: #fef3c7; color: #92400e; }
.status-pending .dot { background: #f59e0b; }

.status-syncing { background: #e0e7ff; color: #3730a3; }
.status-syncing .dot {
  background: #6366f1;
  animation: pulse 1.5s infinite;
}

.status-synced { background: #dcfce7; color: #166534; }
.status-synced .dot { background: #22c55e; }

.status-error { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
.status-error .dot { background: #ef4444; }

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
