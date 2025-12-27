<script setup lang="ts">
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  try {
    await authStore.loginWithGoogle()
    router.push('/')
  } catch (error) {
    console.error('Login failed:', error)
  }
}
</script>

<template>
  <main class="center-content">
    <div class="glass-container">
      <h1>Octane</h1>


      <button @click="handleLogin" class="btn btn-primary">Sign in with Google</button>
    </div>
  </main>
</template>
