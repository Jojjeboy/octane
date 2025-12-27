# Octane - Fuel & Mileage Tracker

A Progressive Web App (PWA) for tracking fuel consumption and mileage, built with Vue 3, Vite, and Firebase.

## Features

- **Offline-First**: Works fully offline with automatic sync when connectivity is restored
- **Firebase Authentication**: Secure Google Sign-In
- **Real-time Sync**: Automatic data synchronization across devices
- **PWA**: Install as a native-like app on any device

## Firebase Configuration

### Prerequisites

Ensure the following environment variables are set (create a `.env` file):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Firestore Structure

```
users/{uid}/
  vehicle/
    data (document) - Single vehicle information
  fuelLogs/{logId} (collection) - Fuel consumption logs
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

## Development

### Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests

```sh
npm run test:unit
```

### Lint with ESLint

```sh
npm run lint
```

## Testing Requirements

All new functionality must:

1. **Add tests first** - Write unit tests before implementation
2. **Document in README** - Update this file with usage and behavior
3. **Verify offline** - Test that features work without connectivity

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Single-Vehicle Architecture

This app explicitly supports **one vehicle per user**. The data model does not support multiple vehicles:

- `vehicle` state is a single object, not an array
- Firestore path is `users/{uid}/vehicle/data` (single document)
