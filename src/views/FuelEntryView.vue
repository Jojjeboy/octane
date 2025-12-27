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

// Edit state
const editingId = ref<string | null>(null)

// Set default date to today
const now = new Date()
date.value = now.toISOString().slice(0, 16) // Format for datetime-local input

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (editingId.value) {
      // Update existing entry
      await fuelEntryStore.updateEntry(editingId.value, {
        date: new Date(date.value).toISOString(),
        odometer: Number(odometer.value),
        fuelAmount: Number(fuelAmount.value),
        fuelPrice: Number(fuelPrice.value)
      })
      successMessage.value = 'Entry updated successfully'
      editingId.value = null
    } else {
      // Create new entry
      const entry: CreateFuelEntryInput = {
        date: new Date(date.value).toISOString(),
        odometer: Number(odometer.value),
        fuelAmount: Number(fuelAmount.value),
        fuelPrice: Number(fuelPrice.value)
      }
      await fuelEntryStore.createEntry(entry)
      successMessage.value = 'Fuel entry added successfully'
    }

    // Reset form
    odometer.value = ''
    fuelAmount.value = ''
    fuelPrice.value = ''
    date.value = new Date().toISOString().slice(0, 16)

  } catch (error: any) {
    errorMessage.value = error.message
  }
}

const startEdit = (entryId: string) => {
  const entry = fuelEntryStore.entries.find(e => e.id === entryId)
  if (entry) {
    editingId.value = entryId
    date.value = new Date(entry.date).toISOString().slice(0, 16)
    odometer.value = entry.odometer
    fuelAmount.value = entry.fuelAmount
    fuelPrice.value = entry.fuelPrice
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const cancelEdit = () => {
  editingId.value = null
  odometer.value = ''
  fuelAmount.value = ''
  fuelPrice.value = ''
  date.value = new Date().toISOString().slice(0, 16)
}

const handleDelete = async (entryId: string) => {
  if (confirm('Are you sure you want to delete this entry?')) {
    try {
      await fuelEntryStore.deleteEntry(entryId)
      successMessage.value = 'Entry deleted successfully'
      setTimeout(() => { successMessage.value = '' }, 3000)
    } catch (error: any) {
      errorMessage.value = error.message
    }
  }
}
</script>

<template>
  <main class="fuel-entry-view">
    <h1>Fuel Entries</h1>

    <!-- Add/Edit Entry Form -->
    <section class="entry-form">
      <h2>{{ editingId ? 'Edit Entry' : 'Add New Entry' }}</h2>

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

        <button type="submit" class="btn-submit">{{ editingId ? 'Update' : 'Add' }} Entry</button>
        <button v-if="editingId" type="button" @click="cancelEdit" class="btn-cancel">Cancel</button>

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
          <div class="entry-details">
            <span class="entry-date">{{ new Date(entry.date).toLocaleDateString() }}</span>
            <span class="entry-odometer">{{ entry.odometer }} km</span>
            <span class="entry-fuel">{{ entry.fuelAmount }} L @ ${{ entry.fuelPrice }}/L</span>
          </div>
          <div class="entry-actions">
            <button @click="startEdit(entry.id)" class="btn-edit">Edit</button>
            <button @click="handleDelete(entry.id)" class="btn-delete">Delete</button>
          </div>
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
  margin-right: 10px;
}

.btn-submit:hover {
  background: #0056b3;
}

.btn-cancel {
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #5a6268;
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
  justify-content: space-between;
  align-items: center;
}

.entry-details {
  display: flex;
  gap: 20px;
}

.entry-date {
  font-weight: bold;
}

.entry-actions {
  display: flex;
  gap: 10px;
}

.btn-edit, .btn-delete {
  padding: 5px 10px;
  border: none;
  cursor: pointer;
}

.btn-edit {
  background: #28a745;
  color: white;
}

.btn-edit:hover {
  background: #218838;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}
</style>
