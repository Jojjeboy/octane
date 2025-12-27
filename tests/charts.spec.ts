import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EfficiencyTrendChart from '@/components/EfficiencyTrendChart.vue'
import AverageMetric from '@/components/AverageMetric.vue'

// Mock vue-chartjs and chart.js
vi.mock('vue-chartjs', () => ({
  Line: {
    name: 'Line',
    template: '<div class="mock-line-chart"></div>',
    props: ['data', 'options']
  }
}))

describe('Chart Components (Visualizations)', () => {
  describe('EfficiencyTrendChart', () => {
    it('renders placeholder when data is insufficient', () => {
      const wrapper = mount(EfficiencyTrendChart, {
        props: {
          metrics: [],
          dates: []
        }
      })
      expect(wrapper.text()).toContain('Insufficient data for chart')
    })

    it('renders chart when data is present', () => {
      const metrics = [
        { entryId: '2', efficiency: 14.28, distance: 500, fuelUsed: 35 }
      ]
      const wrapper = mount(EfficiencyTrendChart, {
        props: {
          metrics,
          dates: ['2025-01-05']
        }
      })
      expect(wrapper.find('.mock-line-chart').exists()).toBe(true)
    })

    it('updates when props change', async () => {
      const wrapper = mount(EfficiencyTrendChart, {
        props: {
          metrics: [],
          dates: []
        }
      })
      expect(wrapper.text()).toContain('Insufficient data for chart')

      await wrapper.setProps({
        metrics: [{ entryId: '2', efficiency: 14.28, distance: 500, fuelUsed: 35 }],
        dates: ['2025-01-05']
      })
      expect(wrapper.find('.mock-line-chart').exists()).toBe(true)
    })
  })

  describe('AverageMetric', () => {
    it('renders placeholder when value is null', () => {
      const wrapper = mount(AverageMetric, {
        props: {
          label: 'Average Efficiency',
          value: null,
          unit: 'km/L'
        }
      })
      expect(wrapper.text()).toContain('Average Efficiency: --')
    })

    it('renders value when present', () => {
      const wrapper = mount(AverageMetric, {
        props: {
          label: 'Average Efficiency',
          value: 12.3456,
          unit: 'km/L'
        }
      })
      expect(wrapper.text()).toContain('Average Efficiency: 12.35 km/L')
    })

    it('renders with custom precision', () => {
      const wrapper = mount(AverageMetric, {
        props: {
          label: 'Cost',
          value: 0.1234,
          unit: '$/km',
          precision: 4
        }
      })
      expect(wrapper.text()).toContain('Cost: 0.1234 $/km')
    })
  })
})
