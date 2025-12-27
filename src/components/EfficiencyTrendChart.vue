<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Metric {
  efficiency: number
  [key: string]: any
}

interface Props {
  metrics: Metric[]
  dates: string[]
}

const props = defineProps<Props>()

const hasData = computed(() => props.metrics.length > 0)

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.dates,
  datasets: [
    {
      label: 'Efficiency',
      backgroundColor: '#007bff',
      borderColor: '#007bff',
      data: props.metrics.map(m => m.efficiency),
      tension: 0.1
    }
  ]
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'Efficiency'
      }
    }
  }
}
</script>

<template>
  <div class="chart-container">
    <div v-if="!hasData" class="placeholder">
      Insufficient data for chart
    </div>
    <div v-else class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  height: 300px;
  width: 100%;
  padding: 20px;
  background: white;
  border: 1px solid #ddd;
  margin-bottom: 20px;
}
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-style: italic;
}
.chart-wrapper {
  height: 100%;
}
</style>
