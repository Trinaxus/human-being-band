# Human Being Band – Style Guide

Dieser Style‑Guide dokumentiert Aufbau, Farben, Typografie, Komponenten und relevante Admin/Galerie‑Workflows der Website.

## Struktur & Technologien
- Framework: React + TypeScript (Vite)
- Styling: Tailwind CSS + projektweite CSS‑Overlays (Light‑Mode)
- Icons: lucide-react
- SPA‑Routing: per interner State/Query (z. B. `?view=...`)
- Server: PHP‑Endpunkte unter `/server/api`
- Uploads: `/uploads/{year}/{gallery}/` (mit optionaler `metadata.json`)

## Theming (Dark & Light Mode)
- Theme‑Schalter per `data-theme` auf `<html>`
  - `data-theme="dark"` (Default)
  - `data-theme="light"` (Creamy Light)
- Light‑Mode Overrides (aus `src/index.css`)
  - Texte: dunkel (`#111827`, `#1F2937`)
  - Hintergründe: warme Creme‑Töne für neutrale Flächen (u. a. `#FFF8EE`, `#FFF3E6`)
  - Ränder: warme, helle Brown/Beige‑Töne (z. B. `#F5DCC4`, `rgba(241,212,184,0.3–0.5)`)
  - Hero‑Overlay: sanfter Verlauf, damit Hintergrundfoto sichtbar bleibt
  - Logo im Header: invertiert (schwarz) im Light‑Mode
- Dark‑Mode nutzt die Tailwind‑Neutral‑Skala (siehe Farben) und transparente Layer

## Farbpalette (Tailwind Erweiterungen)
Aus `tailwind.config.js`:
- Primary
  - 300: `#FDBA74`
  - 400: `#FB923C`
  - 500: `#F97316` (Hauptakzent, warmes Orange)
- Secondary
  - 400: `#F59E0B` (Amber)
  - 500: `#B45309` (warmes Braun)
- Neutral (UI‑Grau‑Skala)
  - 100: `#FFFFFF`
  - 200: `#C1C2C5`
  - 300: `#909296`
  - 400: `#737373`
  - 500: `#5C5F66`
  - 600: `#373A40`
  - 700: `#2C2E33`
  - 800: `#25262B`
  - 900: `#1A1B1E`
- Schatten
  - `shadow-glow-cyan`: `0 0 20px rgba(249, 115, 22, 0.15)` (warmes Orange‑Glühen)

Hinweise
- Close‑Button Rot (Admin): Standard `#77111c`, Hover `#8b1522`.
- Light‑Mode nutzt obige Creme‑Töne als CSS‑Overrides für Tailwind‑Klassen.

## Typografie
- Fließtext/Grundschrift: `Poppins`, Fallbacks: `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`, sans-serif
- Display/Headlines Utility: `.font-display` → `Bebas Neue`, dann `Poppins`/Fallbacks
- Letter‑Spacing Display: `0.08em`
- Größen (Richtwerte, Tailwind Utilities)
  - Body: Standard Tailwind (`text-base` ≈ 16px)
  - Überschriften: `text-lg`/`text-xl`/`text-2xl` je nach Abschnitt
  - Admin‑UI Buttons: `text-sm` bis `text-base`

## Komponenten‑Leitlinien
- Karten/Container
  - Dark: `bg-neutral-900/60..85`, `border-neutral-700/20..40`
  - Light: `bg-white/85`, `border-neutral-200`
- Buttons (Admin Light‑Mode)
  - Hintergrund `bg-white`, Text dunkel, `border-neutral-300`, Hover `bg-neutral-100`
  - Dark‑Mode: `border-neutral-700/40`, Text `text-neutral-200`, Hover `bg-neutral-700`
- Thumbnails/Previews
  - Instagram/YT Thumbs für Link‑Items
  - `.preview-img` im Light‑Mode etwas heller/kontrastreduziert

## Hintergrund & Layout
- Globales Hintergrundbild wird per JS direkt am `body` gesetzt (keine feste CSS‑URL), zusätzliche Layer sind entfernt/vereinheitlicht.
- Zusätzliche Overlays/Orbs wurden reduziert, Performance und Lesbarkeit priorisiert.

## Galerie & Metadata
- Struktur: `/uploads/{year}/{gallery}/` mit optionaler `metadata.json`
- `metadata.json` enthält `items` mit Objekten `{ type, url, title? }`
  - Typen: `image`, `video`, `youtube`, `instagram`
  - Signatur für Gleichheit: `type@@url`
- Whitelist‑Prinzip
  - „Aus Uploads einlesen“ berücksichtigt Dateien nur, wenn sie in `metadata.json` stehen.
  - Link‑Items (YouTube/Instagram) werden immer erhalten.
- Admin Scan‑Report (Servergestützt)
  - Endpunkte: `scan_gallery.php` (GET), `delete_uploads.php` (POST)
  - Zeigt je Galerie:
    - Soll (metadata): Zahl der Datei‑Einträge, bzw. „URLs (N)“ bei Link‑only
    - Ist (Ordner): Dateianzahl
    - Status: Grün „OK“ wenn Soll=Ist; Rot/Amber bei Abweichung; Blau bei URL‑only
    - Details: Liste „extra Dateien“ (nicht in metadata) mit Checkboxen
    - Aktion: „Auswahl löschen“ → physisches Löschen im Upload‑Ordner
- Serverseitige Pfade/URLs
  - `BASE_URL` (z. B. `https://human-being-band.de`) für öffentliche URLs
  - `UPLOAD_DIR` absoluter Serverpfad (z. B. `/www/htdocs/.../uploads`) für Scans/Löschen

## Barrierefreiheit & Interaktion
- Mobile Touch‑Optimierungen: erhöhte Touch‑Targets (44px), no‑scrollbar‑Utilities
- Scrollbar‑Styling in Dark‑Mode, leichte Anpassungen bei Hover
- Animationen: dezente Fade‑Ins, optionale Glow‑Effekte

## Mehrsprachigkeit (DE/EN)
- Die Seite unterstützt Deutsch und Englisch.
- Inhalte (Titel, Texte, Labels) liegen zweisprachig vor; Eingabe‑Masken im Admin berücksichtigen beide Sprachen.
- Technisch bedeutet das:
  - Getrennte Felder/States je Sprache (z. B. `de`/`en`).
  - UI‑Komponenten zeigen/laden je nach aktivem Language‑State die passenden Texte.
  - Zusätzlicher Pflege‑ und Testaufwand, da jede Änderung sprachspezifisch geprüft werden muss.

## Content & Seiten
- Rechtliches (Impressum/Datenschutz) als SPA‑Ansichten (Routing beseitigt Redirect‑Probleme)
- Admin‑Bereich Light‑Mode verfeinert, bessere Kontraste/Lesbarkeit

## Entwicklungs‑Hinweise
- Lokale Entwicklung kann Live‑API via `API_BASE` nutzen (CORS freigegeben)
- Dateien/Ordner „uploads“ sind in Git ignoriert; nur Code/Config committen
- Wichtige Dateien
  - `src/components/AdminContentPanel.tsx` (Admin/Scan‑Report/Uploads)
  - `server/api/scan_gallery.php`, `server/api/delete_uploads.php`

## Deployment & Hosting
- Aktueller Stand: Eine Vercel‑Instanz dient als Platzhalter/Template für die SPA.
- Primäre Ziel‑Domain: `https://human-being-band.de` beim bestehenden Webhoster (mit PHP‑APIs und Uploads).
- Umstellung: Finale Verlinkung/Go‑Live auf der Hauptdomain erfolgt nach Abnahme. Dazu gehört ggf. das Anpassen von `API_BASE`, Routing und Domain‑Verweisen sowie die Deaktivierung der Vercel‑Platzhalter‑URL als öffentliche Startseite.

### E‑Mail & Kommunikation
- Mailboxen/Aliasse beim Hoster anlegen:
  - z. B. `booking@human-being-band.de`, `info@human-being-band.de`, optional `noreply@`.
  - Aliasse auf zentrale Postfächer umleiten (je nach Teamorganisation).
- Versand (SMTP):
  - Formulare (Kontakt/Booking) verwenden Server‑SMTP des Hosters (authentifiziert). Keine Client‑seitigen Mails.
  - Rate‑Limit und Logging im Server‑Endpoint empfehlen (Spam‑Schutz).
- Zustellbarkeit:
  - SPF/DKIM/DMARC in DNS pflegen (Hoster‑Guides nutzen), Absender‑Domain = Hauptdomain.
  - „Reply‑To“ auf die Band‑Mailbox setzen.
- Datenschutz:
  - Kontakt/Booking‑Formulare mit Einwilligungstext verknüpfen (Verweis auf Datenschutzerklärung).
  - Serverseitig nur erforderliche Daten speichern/versenden, Transport über HTTPS.
  - `tailwind.config.js`, `src/index.css`

---
Stand: aktuellste Implementierungen (Scan‑Report, Farben, Light‑Mode‑Anpassungen, Routing‑Fixes).
