<script setup lang="ts">
import { RouterView } from 'vue-router'
import { watch, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useVehicleStore } from '@/store/vehicle'
import { useFuelEntryStore } from '@/store/fuelEntry'
import { useSyncStore } from '@/store/sync'
import { initConnectivityTracker } from '@/services/connectivity'
import SyncStatusIndicator from '@/components/SyncStatusIndicator.vue'

const authStore = useAuthStore()
const vehicleStore = useVehicleStore()
const fuelEntryStore = useFuelEntryStore()
const syncStore = useSyncStore()

// React to auth changes
watch(() => authStore.user, (user) => {
  if (user) {
    vehicleStore.init()
    fuelEntryStore.init()
  } else {
    vehicleStore.cleanup()
    fuelEntryStore.cleanup()
  }
}, { immediate: true })

onMounted(() => {
  initConnectivityTracker((isOnline) => {
    syncStore.setOnline(isOnline)
  })
})
</script>


<template>
  <div v-if="authStore.loading" class="center-content full-height">
    <p>Loading Octane...</p>
  </div>
  <div v-else class="app-layout">
    <header class="app-header">
      <SyncStatusIndicator />
    </header>
    <RouterView />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  padding: 10px 20px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.full-height {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
