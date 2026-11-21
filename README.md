<div align="center">

<img src="artifacts/rakshak/assets/images/icon.png" alt="Rakshak logo" width="96" />

# Rakshak

### Your quiet guardian, always. A women's safety companion app built with Expo and React Native.

<p>
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-1E293B?style=for-the-badge&logo=typescript&logoColor=3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-1A1A1A?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/pnpm-1F1F1F?style=for-the-badge&logo=pnpm&logoColor=F69220" alt="pnpm" />
</p>

</div>

---

## ✨ Overview

**Rakshak** is a mobile-first personal safety app focused on women's safety in Bengaluru. It brings an SOS trigger, a safety map, journey check-ins, discreet escape tools and emergency helplines together in one calm, card-based interface.

The app runs on Android and iOS (via Expo Go) and in the browser from a single Expo + React Navigation codebase. Everything you enter (name, trusted contacts, journeys, reports) stays on the device in AsyncStorage; there is no server and no account.

**Honest by design.** Rakshak never claims it contacted someone when it didn't. On a phone, SOS opens your SMS app with the alert ready to send. In a browser, which can't send SMS, it says so and gives you the message to copy or share plus a one-tap call to 112. Zone and route scores are sample data and are labelled as such.

## 🚀 Features

- **Hold-to-SOS**: hold the SOS button for 1.5s to start a 5-second countdown you can cancel. Rakshak then gets your live GPS location and opens the SMS composer pre-filled for all your trusted contacts, with a Google Maps link to where you are.
- **Shake to SOS**: on a phone, a hard shake starts the same flow (can be turned off in Profile).
- **Safety Map**: an interactive map (react-native-maps on phones, Leaflet + OpenStreetMap on the web, no API key) with sample safe, caution and danger zones and sample route safety scores. "Check my current area" uses your real location. "Open walking directions" hands off to Google Maps. Incident reports are saved on the device.
- **Journey Watch**: set a destination and an arrival time (or 15/30/60 min). If you don't tap "I Arrived Safely" in time, Rakshak asks "Are you safe?" and opens SOS after 60 seconds. You can add 15 minutes. Active journeys survive an app reload.
- **Fake Call**: pick a caller and a delay (now, 10s, 30s, 1 min). A realistic incoming-call screen rings (a ringtone in the browser, vibration on a phone) so you can step away from a situation.
- **Hidden camera checklist**: a guided manual sweep (lens glints, IR LEDs, smoke detectors, chargers, mirrors...) instead of a fake "scan".
- **Emergency helplines**: one-tap calling for 112, Police (100), Women (1091) and Ambulance (108).
- **Onboarding and Profile**: name, trusted contacts (validated, with a primary contact), real location permission, safety stats, and "erase all data".

## 🧱 Tech Stack

| Layer | Tools |
| --- | --- |
| Mobile / Web app | Expo SDK 54, React Native 0.81, React Navigation 6, React Native Web |
| Device APIs | `expo-location`, `expo-sms`, `expo-sensors` (accelerometer), `expo-haptics`, `expo-clipboard`, `react-native-maps` |
| Web map | Leaflet 1.9 + OpenStreetMap tiles in a sandboxed iframe |
| Storage | `@react-native-async-storage/async-storage` |
| API server (scaffold) | Express 5, Pino logging, esbuild bundle |
| Shared libs (scaffold) | OpenAPI spec, Orval codegen, Zod schemas, Drizzle ORM (PostgreSQL) |
| Tooling | pnpm workspaces, TypeScript 5.9 |

## 🗂️ Project Structure

```
Rakshak/
├── artifacts/
│   ├── rakshak/            # Expo / React Native app
│   │   ├── index.ts        # Entry point (registerRootComponent)
│   │   ├── App.tsx         # Navigation: onboarding stack + 5 tabs + fake-call modal
│   │   ├── screens/        # Home, Map, Journey, Detect (Tools), Profile, Onboarding, IncomingCall
│   │   ├── components/     # SOSButton, SOSModal, IncomingCall, ActiveCall, SafeMapView (.native/.web), Toast
│   │   ├── context/        # AppContext (state + AsyncStorage persistence)
│   │   ├── lib/            # emergency.ts: location, SOS message, SMS, share, call
│   │   └── server/         # Zero-dependency static server for web builds
│   ├── api-server/         # Express 5 API (health route only, not used by the app yet)
│   └── mockup-sandbox/     # Vite + shadcn/ui sandbox for UI mockups
├── lib/                    # OpenAPI spec, generated client, Zod schemas, Drizzle schema
└── pnpm-workspace.yaml
```

## ▶️ Run it locally

**You need:** Node.js 20.19 or newer (24 recommended) and pnpm (`npm install -g pnpm`, or `corepack enable`). For a phone, install **Expo Go** from the Play Store or App Store.

```bash
git clone https://github.com/ShoaebMalik19/Rakshak.git
cd Rakshak
pnpm install
pnpm web          # opens the app in your browser at http://localhost:8081
```

`pnpm dev` starts the same dev server without opening the browser and prints a QR code for Expo Go. In that terminal, press `w` for web or `a` for a connected Android emulator.

No API keys or `.env` file are needed: the web map uses OpenStreetMap, and directions hand off to Google Maps by URL.

### On an Android phone (Expo Go)

1. Install **Expo Go** from the Play Store.
2. Make sure the phone and your computer are on the **same Wi-Fi network**.
3. Run `pnpm dev` in the repo root and scan the QR code with Expo Go.
4. If the phone can't connect (common on office, college or hotel Wi-Fi), run `pnpm --filter @workspace/rakshak exec expo start --tunnel` instead. Windows Firewall may also ask you to allow Node.js on private networks; allow it.

On iPhone, scan the QR code with the Camera app. It opens in Expo Go.

### Web preview vs phone

| Feature | Phone (Expo Go) | Browser |
| --- | --- | --- |
| SOS | Opens the SMS app for all contacts with your live location. You press Send. | Can't send SMS: shows the message to copy or share, plus Call 112 |
| Shake to SOS | Yes (accelerometer) | No (no sensor) |
| Location | GPS | Browser geolocation (you must allow it; needs `localhost` or HTTPS) |
| Map | Native map (Google Maps on Android, Apple Maps on iOS) | Leaflet + OpenStreetMap |
| Journey Watch | Works while the app is open | Works while the tab is open |
| Fake call | Vibrates | Plays a synthesised ringtone |
| Helpline calls | Opens the dialer | Opens the system `tel:` handler, if any |

**Known limits (both):** Journey Watch can't alert you while the app is fully closed (that needs background tasks and push notifications in a native build). The distress-word listener and evidence recording are planned but not built, and the app says so. Zone data is sample data.

### Other commands

```bash
pnpm run typecheck                                    # typecheck every package
pnpm --filter @workspace/rakshak run export:web       # static web build into artifacts/rakshak/dist
pnpm --filter @workspace/rakshak exec expo export --platform android   # check the native bundle compiles
pnpm --filter @workspace/api-server run dev           # run the (scaffold) API server
```

The original Replit dev script is kept as `dev:replit` in `artifacts/rakshak/package.json`.

## 🛣️ Roadmap

- Background Journey Watch with local notifications (expo-task-manager + expo-notifications)
- Real community incident reports and zone data through the API and database layer
- On-device distress-word detection and encrypted evidence recording during SOS
- Optional automatic SMS through a backend gateway, with explicit opt-in

## 👤 Author

**Mohammed Shoaeb Malik** · AI & full-stack developer, Bengaluru
GitHub: [@ShoaebMalik19](https://github.com/ShoaebMalik19)

Built with teammates **Naveed Ahmed** and **Fawad Pasha**. Rakshak won the **Katha Hackathon**.
