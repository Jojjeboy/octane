import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '@/App.vue'

// Mock the router
vi.mock('vue-router', () => ({
  RouterView: {
    name: 'RouterView',
    template: '<div>Router View Mock</div>'
  },
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    user: null,
    loading: false,
    initAuth: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}))

// Mock vehicle store
vi.mock('@/store/vehicle', () => ({
  useVehicleStore: () => ({
    vehicle: null,
    fuelLogs: [],
    loading: false,
    error: null,
    init: vi.fn(),
    cleanup: vi.fn(),
    setVehicle: vi.fn(),
    addFuelLog: vi.fn(),
  }),
}))

describe('App Baseline Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads successfully without crashing', () => {
    expect(() => {
      mount(App)
    }).not.toThrow()
  })

  it('renders the RouterView component', () => {
    const wrapper = mount(App)
    expect(wrapper.html()).toContain('Router View Mock')
  })

  it('handles offline mode without crashing', async () => {
    // Simulate offline by mocking navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    expect(() => {
      mount(App)
    }).not.toThrow()

    // Restore online state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })
})
