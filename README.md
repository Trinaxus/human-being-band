Booking.tonband – Booking App

# Überblick
Booking.tonband ist eine leichte Booking-/Content-App mit kleinem PHP‑Backend (Datei‑Persistenz) und einem React/Vite‑Frontend.

# Architektur
- Backend (PHP): `server/api/*`
  - Persistenz: `server/data/content.json` (nur API liest/schreibt; direkte Zugriffe via `.htaccess` blockiert)
  - Uploads (generisch): `server/api/upload.php`
- Frontend (React/Vite): `src/*`
  - Kommuniziert ausschließlich mit der PHP‑API (kein Supabase).

# Wichtige Dateien & Ordner
- `server/.env`: Serverkonfiguration (CORS, BASE_URL, Session/Cookies, Pfade, Admin‑Login)
- `server/api/*.php`: REST‑artige Endpunkte (Login/Logout, Content, Kommentare, Orders usw.)
- `server/data/content.json`: Zentrale Inhalte (Hero, About, Contact, Gallery, Map, Socials, Reviews, Tickets, updated_at)
- `src/components/`: UI‑Komponenten (`HomePage`, `AdminPage`, `OverviewPage`, `ResetPasswordPage`, `TwoFASetupCard` …)
- `src/lib/api.ts`: API‑Helper (JSON/FormData je nach Endpoint)

# API‑Endpunkte (Auszug)
- Auth: `login.php`, `logout.php`, `me.php`, `register.php`, `twofa.php`, `oauth_google_start.php`, `oauth_google_callback.php`
- Content: `content.php` (GET/POST – lädt/speichert `content.json`)
- Kommentare: `comments.php?action=list|public|approve|delete|submit`
- Orders/Tickets: `orders.php`
- Users (Admin): `users.php?action=list|setRole`
- Upload: `upload.php`

# Features (Frontend)
- Home
  - Hero mit Bild/Overlay (Fokus/Zoom/Höhe steuerbar)
  - Tickets‑Sektion: Buchungs‑Modal in Schritten; Button „Buchen“ (Login notwendig)
  - Über uns, Kontakt
  - Social‑Links (Icon‑Leiste, weiß)
  - Galerie: bis 4 Bilder pro Viewport, horizontales Scrollen, originale Aspektratio
  - Karte (Map): Full‑bleed mobil, im Container auf Desktop
  - Bewertungen: Histogramm, Sortierung „Highest/Newest“, Formular für neue Bewertung
- Admin
  - Content‑Panel: Hero, About, Contact, Gallery (mit Vorschau), Map, Reviews‑Moderation, Social (mit Dropdown + Icon, inkl. WhatsApp)
  - Tickets‑Panel
  - User‑Verwaltung
- Auth
  - Login, Registrierung, Passwort‑Reset, 2FA‑Setup (TOTP)

# Lokale Entwicklung
1) Abhängigkeiten
```
npm install
```
2) Dev‑Server
```
npm run dev
```
3) Build
```
npm run build
```
4) Frontend greift per `VITE_API_BASE` (Projekt-`.env`) auf die PHP‑API zu. Ohne Wert default: `/server/api`.

# Deployment
- Frontend: statische Auslieferung des `dist/` Ordners (z. B. auf Webspace, Nginx/Apache, oder beliebiges Static Hosting)
- Backend: PHP 8.x mit Apache (oder kompatibel). `server/api/` deployen; `server/data/` muss beschreibbar sein.
- Build‑Artefakte: `npm run build` → `dist/`

## Server‑Konfiguration (`server/.env`)
- `CORS_ALLOWED_ORIGINS`: kommaseparierte Liste erlaubter Origins
- `BASE_URL`: öffentliche Basis‑URL
- `DATA_DIR`, `UPLOAD_DIR`: echte Serverpfade
- `SESSION_NAME`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=None`
- Admin: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`

## CORS
- `bootstrap.php`/`.htaccess` setzen CORS‑Header nur für definierte Origins.
- Für lokale Entwicklung alle Varianten eintragen: `http://localhost:5173, https://localhost:5173, http://127.0.0.1:5173`.

# Troubleshooting
- CORS/OPTIONS: Origin in `.env` ergänzen, Server neustarten/neu laden, Browser‑Cache leeren
- 403 bei POST `content.php`: Admin‑Session notwendig
- Map zu breit: Iframe nur mobil `w-screen`, ab `sm` `w-full`
- Galerie gestreckt: `object-contain` wird verwendet; optional `max-h-*` setzen

# Lizenz / Hinweise
Interne Projektbasis. Bei Bedarf ergänzen.
