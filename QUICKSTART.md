# Quickstart (2-5 minutes)

Use this if you just want to run the app fast.

## 1) Install prerequisites

- Install Node.js LTS: [https://nodejs.org](https://nodejs.org)
- Have access to the Firebase project used by this app

Check tools:

```bash
node --version
npm --version
```

## 2) Open the project

```bash
cd "C:\Users\hrtyd\Downloads\TBD\CIS-444-Final-Project-main"
```

## 3) Install dependencies

```bash
npm install
```

If PowerShell blocks `npm`, run:

```powershell
npm.cmd install
```

## 4) Confirm Firebase config

Open `js/firebase-config.js` and verify the Firebase config values are set correctly.

At minimum, confirm:

- `apiKey`
- `authDomain`
- `projectId`
- `appId`

## 5) Start dev server

```bash
npm run dev
```

If needed on Windows:

```powershell
npm.cmd run dev
```

Open the URL shown in terminal (usually `http://localhost:5173/login/index.html`).

## 6) Smoke test

1. Create account
2. Log in
3. Create a journal entry
4. Refresh dashboard and confirm it appears

## 7) Production-style run (optional)

```bash
npm run build
npm start
```

Then open: `http://localhost:3000/login/index.html`

## Common Windows fixes

- **`npm` not recognized:** add `C:\Program Files\nodejs` to PATH, restart terminal
- **PowerShell unsigned script:** use `npm.cmd ...` or run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

- **`node` not recognized:** PATH does not include Node install folder
