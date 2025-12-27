<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
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
