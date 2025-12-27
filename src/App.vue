<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useVehicleStore } from '@/store/vehicle'
import { watch } from 'vue'

const authStore = useAuthStore()
const vehicleStore = useVehicleStore()

// React to auth changes
watch(() => authStore.user, (user) => {
  if (user) {
    vehicleStore.init()
  } else {
    vehicleStore.cleanup()
  }
}, { immediate: true })
</script>


<template>
  <div v-if="authStore.loading" class="center-content full-height">
    <p>Loading Octane...</p>
  </div>
  <RouterView v-else />
</template>

<style scoped>
.full-height {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
