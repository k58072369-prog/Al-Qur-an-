# مفاتيح حفظ القرآن (Mafatih Tathbeet)

A Quran memorization companion app built with Expo + React Native (with web support via react-native-web).

## Tech Stack
- **Framework:** Expo SDK 54 + Expo Router (file-based routing)
- **UI:** React Native 0.81 + react-native-web, NativeWind (Tailwind), Reanimated
- **State:** Zustand + custom AppStore context
- **Languages:** TypeScript
- **Fonts:** Tajawal & Amiri (Google Fonts via Expo)
- **Direction:** RTL (Arabic)

## Project Layout
- `app/` – Expo Router routes (`_layout.tsx`, `index.tsx`, `(tabs)/`, etc.)
- `src/components/`, `src/screens/`, `src/store/`, `src/theme/`, `src/data/`, `src/features/`, `src/hooks/`, `src/utils/`
- `assets/` – icons, fonts, images
- `global.css`, `tailwind.config.js`, `nativewind-env.d.ts` – NativeWind/Tailwind setup
- `metro.config.js`, `babel.config.js` – Metro + NativeWind config

## Replit Setup
- **Workflow:** `Start application` runs `npx expo start --web --port 5000` (webview, port 5000).
- Metro/Expo dev server binds to `0.0.0.0:5000` and accepts proxied hosts (no host check).
- **Deployment:** Configured as `static`. Build command `npx expo export -p web`, output directory `dist/`.

## Notes
- The app forces RTL via `I18nManager.forceRTL(true)`.
- A custom splash screen displays for ~3.2s before revealing the Stack navigator.
- `expo-av` is deprecated upstream (warning only); not blocking.
- The runtime update check fetches `version.json` from GitHub raw; on web this may be blocked by CORS and falls back gracefully to cached data.

## Chat Section ("شات" tab)
- **Web build** (`src/screens/ChatScreen.web.tsx`): direct port of the user-provided `App.tsx` (Vite/React reference). Uses `motion/react`, `lucide-react`, `react-markdown`, `clsx`, `tailwind-merge`, `@google/genai` — installed via npm. Companion stylesheet `src/screens/chat-web.css` ports the relevant pieces of the provided `index.css` (custom theme variables, `.glass`, `.grid-bg`, markdown body, scrollbar, animations) since the project doesn't run Tailwind v4 / Vite.
- **Native build** (`src/screens/ChatScreen.tsx`): React Native version kept as the platform fallback. Metro auto-resolves `.web.tsx` for web and `.tsx` for iOS/Android.
- **Brand mark:** the placeholder `M` letter from the reference is replaced everywhere with the transparent logo (`assets/images/logo_transparent.png`), color-tinted via CSS `filter` for light/dark backgrounds.
- **API key:** read from `process.env.EXPO_PUBLIC_GEMINI_API_KEY` (Expo only inlines vars prefixed with `EXPO_PUBLIC_`). Set it in Replit Secrets, or copy `.env.example` → `.env`. If missing, the chat shows a friendly Arabic warning instead of crashing.
- **Model:** `gemini-1.5-flash` (the reference asked for `gemini-3-flash-preview`, which is not yet generally available; switching is a one-line change).
- Chat tab routes via `app/(tabs)/chat.tsx` → `src/screens/ChatScreen` and is also exposed as a quick-access card on the dashboard.
