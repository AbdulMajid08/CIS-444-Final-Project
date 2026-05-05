# Mood Journal (Firebase + Vite)

A journaling web app with:

- Firebase Authentication (email/password)
- Cloud Firestore for journal entries
- Vite for local development and build
- Node + Express to serve the production build (`dist/`)

## Tech Stack

- Frontend: HTML/CSS/JS (multi-page app)
- Auth: Firebase Auth
- Database: Cloud Firestore
- Tooling: Vite
- Runtime: Node.js

## Open Source Libraries

- `express` - Node.js web framework used by `server.js`
- `cors` - CORS middleware for Express
- `firebase` - Firebase web SDK for auth and Firestore
- `vite` - Frontend development and build tool

## Project Structure

- `login/` - Sign in / create account
- `dashboard/` - List and manage entries
- `journal/` - Create and edit entries
- `js/firebase-config.js` - Firebase app initialization
- `js/api.js` - Firebase Auth + Firestore API wrapper
- `firestore.rules` - Recommended Firestore security rules
- `server.js` - Serves built app from `dist/`

## Prerequisites

Install before running:

1. Node.js LTS: [https://nodejs.org](https://nodejs.org)
2. A Firebase project

Verify Node/npm:

```bash
node --version
npm --version
```

If either command fails, install Node and ensure it is on your system `PATH`.

## Firebase Setup (Required)

### 1) Create project

Go to [Firebase Console](https://console.firebase.google.com/) and create a project.

### 2) Create a Web app and copy config

In Firebase Console:

1. Project Settings
2. Your apps
3. Add app (Web)
4. Copy the config values

### 3) Enable Authentication

1. Build -> Authentication -> Sign-in method
2. Enable Email/Password

### 4) Enable Firestore

1. Build -> Firestore Database
2. Create database (choose a region)

### 5) Configure app keys

Open `js/firebase-config.js` and verify values are set for:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- optional `measurementId`

This file already contains a working config shape. You can keep hardcoded values for development or switch to `VITE_*` environment variables.

### 6) Apply Firestore rules

Use the rules in `firestore.rules`:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/journalEntries/{entryId} {
      allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

These rules ensure each signed-in user can only access their own journal entries.

## Install and Run

From project root:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173/login/index.html`).

## Production-Style Local Run

Build first:

```bash
npm run build
```

Then run the Node server:

```bash
npm start
```

Open:

`http://localhost:3000/login/index.html`

## Data Model

Journal entries are stored per user:

- `users/{uid}/journalEntries/{entryId}`

Each entry includes:

- `date`
- `title`
- `mood`
- `text`
- `createdAt`

## Troubleshooting

### `npm` is not recognized (Windows)

Node is not on `PATH`, or PowerShell blocked script execution.

Try:

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
npm.cmd --version
npm.cmd install
npm.cmd run dev
```

If PowerShell blocks `npm.ps1`, either:

- use `npm.cmd ...` commands, or
- set policy for current user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### `node` is not recognized

Add Node install path to user PATH and restart terminal/IDE:

- `C:\Program Files\nodejs`

### `EPERM` errors while installing

Something is locking `node_modules`.

1. Close terminals/editors using the folder
2. Delete `node_modules`
3. Re-run install

### Firestore `permission-denied`

- Rules not deployed or mismatched path
- Confirm app writes to `users/{uid}/journalEntries`
- Confirm user is signed in

### App opened with `file://` and not working

Use `npm run dev` or `npm start`; do not open HTML files directly from disk.

## Useful Commands Cheat Sheet

### Core

```bash
# install deps
npm install

# run development server
npm run dev

# build production assets
npm run build

# serve dist/ with express
npm start
```

### Clean reinstall

```bash
# macOS/Linux
rm -rf node_modules package-lock.json
npm install
```

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### Quick environment checks

```bash
node --version
npm --version
```

```powershell
where.exe node
where.exe npm
```

### Windows fallback when PowerShell policy blocks npm

```powershell
npm.cmd install
npm.cmd run dev
```

## Suggested First Test

1. `npm run dev`
2. Create a new account
3. Add a journal entry
4. Refresh dashboard and verify entry appears
5. Sign out and sign back in
6. Edit and delete an entry

## Notes

- Firebase web API keys are public by design, but security depends on Auth and Firestore rules.
- For deployment, you can use Firebase Hosting or another static host + backend as needed.
