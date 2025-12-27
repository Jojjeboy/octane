<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label: string
  value: number | null
  unit?: string
  precision?: number
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  precision: 2
})

const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return '--'
  }
  return props.value.toFixed(props.precision)
})
</script>

<template>
  <div class="average-metric">
    <span class="label">{{ label }}: </span>
    <span class="value">{{ formattedValue }}{{ value !== null && unit ? ' ' + unit : '' }}</span>
  </div>
</template>

<style scoped>
.average-metric {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 10px;
}
.label {
  font-weight: bold;
}
.value {
  color: #007bff;
}
</style>
