Human Being Band – Site & Admin

# Überblick
Human Being Band ist eine Content‑Site mit Admin‑Bereich. Frontend: React/Vite. Backend: kleines PHP‑API (Datei‑Persistenz in JSON).

# Architektur
- Backend (PHP): `server/api/*`
  - Persistenz: `server/data/content.json` (nur API liest/schreibt; direkte Zugriffe via `.htaccess` blockiert)
  - Uploads (generisch): `server/api/upload.php`
- Frontend (React/Vite): `src/*`
  - Kommuniziert ausschließlich mit der PHP‑API (kein Supabase)

# Wichtige Dateien & Ordner
- `server/.env`: Serverkonfiguration (CORS, BASE_URL, Session/Cookies, Pfade, Admin‑Login)
- `server/api/*.php`: REST‑artige Endpunkte (Login/Logout, Content, Kommentare, Orders usw.)
- `server/data/content.json`: Zentrale Inhalte (Hero, About, Contact, Galleries, Map, Socials, News, Tickets, updated_at)
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
  - Überschriften mittig: News, Social (Icons zentriert), Galerie, Über uns
  - Karten‑Design konsistent (Light/Dark): `rounded‑xl`, warme Border im Light‑Mode, `bg‑neutral‑900` im Dark‑Mode
  - Globales Hintergrundbild mit Filtern (brightness/contrast/saturate/grayscale/sepia/blur/hue) und Tint (Farbe/Deckkraft)
  - Hintergrundbild‑Position steuerbar (X/Y in %)
  - Tickets‑Sektion mit Modal; Über uns, Kontakt, Social, Galerie (mit Lightbox)
  - Karte: mobil full‑bleed, Desktop im Container
- Admin
  - Content‑Panel: Hero, Background (Filter/Tint/Pos X/Y), News (WYSIWYG ODER HTML‑Modus), About, Contact, Galleries (Jahr/Galerie/Items), Social, Map
  - Layout stabil (eigener globaler BG‑Layer; Admin selbst nicht transparent)
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
- Frontend (z. B. Vercel/Static Hosting): `npm run build` → Ordner `dist/`
- Backend (PHP 8.x): `server/api/` deployen; `server/data/` muss beschreibbar sein
- Repository (Vercel): Projekt muss mit `Trinaxus/human-being-band` verknüpft sein (Branch `main`)
- Domain: ggf. Domains vom alten Projekt trennen und hier hinzufügen

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
- Falsches Deploy‑Repo: In Vercel Projekt → Settings → Git → Repo auf `Trinaxus/human-being-band` setzen
- API nicht erreichbar: `VITE_API_BASE` korrekt auf PHP‑Backend setzen (sonst Default `/server/api`)
- CORS/OPTIONS: Origin in `.env` ergänzen, Server neustarten, Cache leeren
- 403 bei POST `content.php`: Admin‑Login erforderlich

# Lizenz / Hinweise
Interne Projektbasis. Bei Bedarf ergänzen.
