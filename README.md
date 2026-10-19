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

**Rakshak** is a mobile-first personal safety app focused on women's safety in Bengaluru. It brings an SOS trigger, a safety map, journey tracking, discreet escape tools and emergency helplines together in one calm, card-based interface.

The app runs on Android, iOS (via Expo Go) and the web from a single Expo Router codebase. User data such as your name and trusted contacts stays on the device (AsyncStorage). Some features are interactive prototypes that run on demo data and are clearly labelled in the UI (for example "Simulate Detection" and "Simulate Zone Entry Alert").

## 🚀 Features

- **Hold-to-SOS**: press and hold the SOS button for 1.5s to start a countdown you can cancel. When it finishes, your SMS app opens with a pre-filled alert for your trusted contacts.
- **Shake to alert**: on native devices, a hard shake (accelerometer) opens the SOS flow.
- **Safety Map**: danger, caution and safe zones across Bengaluru plotted on a map, plus an incident-report sheet with an anonymous option.
- **Journey Watch**: set a destination and expected arrival time, then confirm "I Arrived Safely". Completed journeys are kept in a history list.
- **Detection Tools**: a camera-scan flow for hidden cameras, a "Distress Listener" with a trigger keyword and sensitivity setting, and a **Fake Call** with a chosen caller and delay so you can leave a situation discreetly.
- **Emergency Helplines**: one-tap dialing for Police (100), Ambulance (108) and other helplines.
- **Onboarding**: a 3-step setup that asks for your name, your first trusted contact and permissions.
- **Profile**: trusted contacts, safety settings, safety stats and an evidence log.

## 🧱 Tech Stack

| Layer | Tools |
| --- | --- |
| Mobile / Web app | Expo SDK 54, React Native 0.81, Expo Router, React Native Web |
| UI & motion | Reanimated, Expo Linear Gradient, Expo Blur, Expo Haptics, `@expo/vector-icons` |
| Device APIs | `expo-location`, `expo-sensors` (accelerometer), `expo-av`, `react-native-maps` |
| Storage | `@react-native-async-storage/async-storage` |
| API server | Express 5, Pino logging, esbuild bundle |
| Shared libs | OpenAPI spec, Orval codegen, Zod schemas, Drizzle ORM (PostgreSQL) |
| Tooling | pnpm workspaces, TypeScript 5.9 |

## 🗂️ Project Structure

```
Rakshak/
├── artifacts/
│   ├── rakshak/            # Expo / React Native app
│   │   ├── app/            # Expo Router routes: (tabs), onboarding
│   │   ├── screens/        # Home, Map, Journey, Detect, Profile, Onboarding
│   │   ├── components/     # SOSButton, SOSModal, IncomingCall, HelplineBar, ...
│   │   ├── context/        # AppContext (state + AsyncStorage persistence)
│   │   └── server/         # Zero-dependency static server for web builds
│   ├── api-server/         # Express 5 API (health route)
│   └── mockup-sandbox/     # Vite + shadcn/ui sandbox for UI mockups
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval config
│   ├── api-client-react/   # Generated React API client
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + config
└── pnpm-workspace.yaml
```

## ⚡ Getting Started

**Prerequisites:** Node.js 24, pnpm, and the Expo Go app (to run on a phone).

```bash
git clone https://github.com/ShoaebMalik19/Rakshak.git
cd Rakshak
pnpm install
```

**Run the app.** The `dev` script is set up for Replit. To run it locally, start Expo directly:

```bash
cd artifacts/rakshak
pnpm exec expo start
```

Then scan the QR code with Expo Go, or press `w` to open the web build.

**Other workspace commands:**

```bash
pnpm run typecheck                                  # typecheck every package
pnpm run build                                      # typecheck + build all packages
pnpm --filter @workspace/api-server run dev         # run the API server
pnpm --filter @workspace/api-spec run codegen       # regenerate the API client and Zod schemas
pnpm --filter @workspace/db run push                # push the DB schema (dev only)
```

## 🛣️ Roadmap

- Replace the simulated detection and zone alerts with real on-device signals
- Send live GPS coordinates in SOS messages (the current message uses a fixed location)
- Connect incident reports and journeys to the API and database layer

## 👤 Author

**Mohammed Shoaeb Malik** · AI & full-stack developer, Bengaluru
GitHub: [@ShoaebMalik19](https://github.com/ShoaebMalik19)
