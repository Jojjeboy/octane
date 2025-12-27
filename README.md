# Octane - Fuel & Mileage Tracker

A Progressive Web App (PWA) for tracking fuel consumption and mileage, built with Vue 3, Vite, and Firebase.

## Purpose

Octane is an offline-first PWA designed to help users track their vehicle's fuel consumption and mileage. The application emphasizes reliability, working seamlessly both online and offline with automatic data synchronization.

## Tech Stack

- **Frontend**: Vue 3 (Composition API), TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Backend**: Firebase (Authentication, Firestore)
- **PWA**: vite-plugin-pwa (Workbox)
- **Testing**: Vitest, Vue Test Utils
- **Linting**: ESLint, Prettier

## Project Structure

```
octane/
├── src/
│   ├── components/      # Reusable Vue components
│   ├── views/           # Page-level components
│   ├── store/           # Pinia stores (auth, vehicle)
│   ├── services/        # External services (Firebase)
│   ├── utils/           # Utility functions
│   ├── router/          # Vue Router configuration
│   ├── assets/          # Static assets (CSS, images)
│   ├── App.vue          # Root component
│   └── main.ts          # Application entry point
├── tests/               # Unit tests
├── public/              # Public static assets
└── dist/                # Production build output
```

## Installation

### Prerequisites

- Node.js (v20.19.0 or v22.12.0+)
- npm or yarn
- Firebase project with Authentication and Firestore enabled

### Steps

1. **Clone the repository**:

```sh
git clone https://github.com/Jojjeboy/octane.git
cd octane
```

2. **Install dependencies**:

```sh
npm install
```

3. **Configure Firebase**:
   Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

4. **Run development server**:

```sh
npm run dev
```

## Deployment

### GitHub Pages

1. **Update `vite.config.ts`**:
   Ensure `base` is set to your repository name:

```ts
export default defineConfig({
  base: '/octane/', // Must match your repo name
  // ...
})
```

2. **Build for production**:

```sh
npm run build
```

3. **Deploy to GitHub Pages**:

**Option A: Using GitHub Actions** (Recommended)

- Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - uses: actions/deploy-pages@v4
```

**Option B: Manual Deployment**

```sh
# Install gh-pages
npm install -D gh-pages

# Deploy
npx gh-pages -d dist
```

4. **Configure GitHub Pages**:

- Go to repository settings → Pages
- Set source to `gh-pages` branch (or GitHub Actions)
- Access your app at `https://yourusername.github.io/octane/`

## Running the App

### Development Mode

```sh
npm run dev
```

Access at `http://localhost:5173`

### Production Build

```sh
npm run build
npm run preview
```

### Running Tests

```sh
# Run all tests
npm run test:unit

# Run specific test file
npm run test:unit tests/app.spec.ts

# Watch mode
npm run test:unit -- --watch
```

## Firebase Configuration

### Firestore Structure

```
users/{uid}/
  vehicle/
    data (document) - Single vehicle information
  fuelLogs/{logId} (collection) - Fuel consumption logs (deprecated - use fuelEntries)
  fuelEntries/{entryId} (collection) - Fuel fill-up entries
    - id (string): Unique identifier
    - date (string): ISO 8601 timestamp
    - odometer (number): Odometer reading in km/miles
    - fuelAmount (number): Fuel quantity in liters/gallons
    - fuelPrice (number): Price per unit
    - createdAt (timestamp): Creation timestamp
    - updatedAt (timestamp): Last update timestamp
```

### Security Rules

Ensure your Firestore security rules allow authenticated users to read/write their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Data Persistence & Offline Behavior

### Offline-First Architecture

The application uses **Firestore's persistent local cache** to ensure full offline functionality:

1. **All user actions succeed offline** - Create, read, update, and delete operations work without connectivity
2. **Local cache** - Data is stored in IndexedDB via Firestore's `persistentLocalCache`
3. **Automatic sync** - When connectivity is restored, all pending changes sync to Firebase automatically
4. **Real-time updates** - Uses Firestore `onSnapshot` for live data synchronization

### Conflict Resolution

- **Strategy**: Last-Write-Wins (LWW) using Firestore's default behavior
- **Timestamps**: `serverTimestamp()` is used for `createdAt` and `updatedAt` fields
- **Deterministic**: All writes include server timestamps to ensure consistent ordering

### State Management

- **Centralized**: All Firebase interactions flow through the Pinia `vehicleStore`
- **No scattered writes**: Components never directly interact with Firebase
- **Testable**: Firebase calls are mocked in unit tests

## Features

### Current Features

- ✅ Google Authentication
- ✅ Offline-first data persistence
- ✅ Real-time sync with Firebase
- ✅ PWA installability
- ✅ Single-vehicle architecture
- ✅ **Fuel Entry Creation** - Add fuel fill-up records with validation
- ✅ **Fuel Entry Update & Delete** - Edit and delete entries with offline support
- ✅ **Fuel Efficiency & Cost Calculations** - Pure domain logic for deriving metrics

### Fuel Entry Domain Model

The `FuelEntry` represents a single fuel fill-up with the following fields:

- **id** (string): Unique identifier
- **date** (ISO 8601): Fill-up date and time
- **odometer** (number): Odometer reading (must be positive)
- **fuelAmount** (number): Fuel quantity (must be positive)
- **fuelPrice** (number): Price per unit (must be positive)
- **station** (string): Gas station name (optional)
- **createdAt** (timestamp): When the entry was created
- **updatedAt** (timestamp): Last modification time

#### Validation Rules

- Odometer, fuel amount, and price must be positive
- Date cannot be in the future
- All fields are required
- Updates must also pass the same validation rules

#### CRUD Operations

**Create**

- Fuel entries can be created while offline
- Entries are stored locally immediately
- Automatic sync to Firebase when connectivity is restored
- No duplicates created during sync

**Update**

- Entries can be edited while offline
- Updates persist locally with immediate UI feedback
- `updatedAt` timestamp automatically updated
- Changes sync to Firebase when online

**Delete**

- **Strategy**: Hard delete using Firestore `deleteDoc()`
- Entries removed from local state immediately (optimistic)
- Delete operations sync to Firebase when online
- No resurrection of deleted entries after sync

- Deterministic and prevents data corruption

### Fuel Calculations

The application includes a pure domain calculation layer (`src/domain/fuelCalculations.ts`) that derives metrics from fuel entries.

#### Pure Domain Logic

- **No Side Effects**: Functions are pure and do not perform I/O, network calls, or state mutations.
- **Unit-Agnostic**: Calculations are based on inputs; they do not assume specific units (e.g., handles both km/L and MPG if units are consistent).
- **Deterministic**: Identical inputs always produce identical outputs.
- **No Dependencies**: Independent of Vue, Pinia, or Firebase.

#### Metrics Definitions

- **Average Efficiency**: (Total distance traveled) / (Total fuel consumed). Calculated from the first entry (baseline) to the last entry.
- **Per-Entry Efficiency**: Efficiency for a specific fill-up, calculated as (Distance since previous fill-up) / (Fuel added at this fill-up).
- **Average Cost per Distance**: (Total cost of fuel) / (Total distance traveled).

#### Edge Case Behavior

- **Fewer than Two Entries**: Returns `null` or empty results, as progress cannot be measured.
- **Non-Monotonic Odometer**: Throws an explicit error if odometer readings decrease or stay the same.
- **Invalid Fuel Amounts**: Throws an error if fuel amounts are zero or negative.
- **Large Datasets**: Optimized for efficiency without unnecessary recomputation.

### Upcoming Features

_Future features will be added here following test-driven development_

## Development Guidelines

### Test-Driven Development (Mandatory)

All new functionality **must**:

1. **Add tests first** - Write unit tests before implementation
2. **Document in README** - Update this file under "Features" section
3. **Verify offline** - Test that features work without connectivity

### Code Quality

- Use clear, descriptive naming conventions
- Avoid premature optimization
- Add comments only where intent is not obvious
- No placeholder or demo code without explanation

### Non-Goals (Current Phase)

❌ Fuel entry forms (not yet implemented)  
❌ Charts and visualizations  
❌ Predictions or analytics

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue Official Extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Single-Vehicle Architecture

This app explicitly supports **one vehicle per user**. The data model does not support multiple vehicles:

- `vehicle` state is a single object, not an array
- Firestore path is `users/{uid}/vehicle/data` (single document)

## License

This project is private and not licensed for public use.
