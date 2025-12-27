<script setup lang="ts">
import { ref } from 'vue'
import { useFuelEntryStore, type CreateFuelEntryInput } from '@/store/fuelEntry'

const fuelEntryStore = useFuelEntryStore()

// Form fields
const date = ref('')
const odometer = ref<number | ''>('')
const fuelAmount = ref<number | ''>('')
const fuelPrice = ref<number | ''>('')
const errorMessage = ref('')
const successMessage = ref('')

// Set default date to today
const now = new Date()
date.value = now.toISOString().slice(0, 16) // Format for datetime-local input

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const entry: CreateFuelEntryInput = {
      date: new Date(date.value).toISOString(),
      odometer: Number(odometer.value),
      fuelAmount: Number(fuelAmount.value),
      fuelPrice: Number(fuelPrice.value)
    }

    await fuelEntryStore.createEntry(entry)

    successMessage.value = 'Fuel entry added successfully'

    // Reset form
    odometer.value = ''
    fuelAmount.value = ''
    fuelPrice.value = ''
    date.value = new Date().toISOString().slice(0, 16)

  } catch (error: any) {
    errorMessage.value = error.message
  }
}
</script>

<template>
  <main class="fuel-entry-view">
    <h1>Fuel Entries</h1>

    <!-- Add Entry Form -->
    <section class="entry-form">
      <h2>Add New Entry</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="date">Date & Time:</label>
          <input
            v-model="date"
            type="datetime-local"
            id="date"
            required
          />
        </div>

        <div class="form-group">
          <label for="odometer">Odometer:</label>
          <input
            v-model.number="odometer"
            type="number"
            id="odometer"
            step="1"
            min="0"
            required
            placeholder="km or miles"
          />
        </div>

        <div class="form-group">
          <label for="fuelAmount">Fuel Amount:</label>
          <input
            v-model.number="fuelAmount"
            type="number"
            id="fuelAmount"
            step="0.01"
            min="0"
            required
            placeholder="liters or gallons"
          />
        </div>

        <div class="form-group">
          <label for="fuelPrice">Price per Unit:</label>
          <input
            v-model.number="fuelPrice"
            type="number"
            id="fuelPrice"
            step="0.001"
            min="0"
            required
            placeholder="price"
          />
        </div>

        <button type="submit" class="btn-submit">Add Entry</button>

        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <div v-if="successMessage" class="success">{{ successMessage }}</div>
      </form>
    </section>

    <!-- Entries List -->
    <section class="entries-list">
      <h2>Recent Entries</h2>

      <div v-if="fuelEntryStore.loading">Loading entries...</div>
      <div v-else-if="fuelEntryStore.entries.length === 0">No entries yet</div>

      <ul v-else>
        <li v-for="entry in fuelEntryStore.entries" :key="entry.id" class="entry-item">
          <span class="entry-date">{{ new Date(entry.date).toLocaleDateString() }}</span>
          <span class="entry-odometer">{{ entry.odometer }} km</span>
          <span class="entry-fuel">{{ entry.fuelAmount }} L</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.fuel-entry-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.entry-form {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.btn-submit {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  cursor: pointer;
}

.btn-submit:hover {
  background: #0056b3;
}

.error {
  color: red;
  margin-top: 10px;
}

.success {
  color: green;
  margin-top: 10px;
}

.entries-list {
  padding: 20px;
}

.entries-list ul {
  list-style: none;
  padding: 0;
}

.entry-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 20px;
}

.entry-date {
  font-weight: bold;
}
</style>
