# Hosting & Routing Setup (ALL-INKL + Vercel + Lokal)

Dieser Leitfaden beschreibt Schritt-für-Schritt, wie du die Domain human-being-band.de so konfigurierst, dass:
- das Frontend über Vercel (www + Apex) ausgeliefert wird,
- die PHP‑API über ALL‑INKL unter api.human-being-band.de erreichbar ist,
- lokales Entwickeln ohne sichtbare Subdomains funktioniert.

Die Anleitung ist streng getrennt nach Systemen (ALL‑INKL vs. Vercel) und enthält eine Check‑Liste zur Verifikation sowie eine Troubleshooting‑Sektion.

---

## 0) Überblick (Mind‑Map / Architektur)

```
[Browser]
  └─ Lokal Dev: http://localhost:5173
      └─ ruft /server/api/...  ─────▶ [Vite Proxy] ─────────▶ https://api.human-being-band.de/server/api/ (ALL‑INKL)

  └─ Live: https://www.human-being-band.de
      ├─ Frontend (Vercel Build)
      └─ API‑Calls ─────────────────▶ https://api.human-being-band.de/server/api/ (ALL‑INKL)

Domains:
  human-being-band.de  ─▶ Vercel (A: 76.76.21.21)  ↪ Redirect → www.human-being-band.de
  www.human-being-band.de ─▶ Vercel (CNAME: <vercel-dns-host>)
  api.human-being-band.de ─▶ ALL‑INKL (A: 85.13.167.233)
```

---

## 1) ALL‑INKL: DNS (KAS) – Domain human-being-band.de

- Setze die DNS‑Einträge exakt wie folgt (andere Einträge wie MX/TXT/NS bleiben unverändert):
  - A @ = 76.76.21.21  (Vercel A‑Record; Apex zeigt zu Vercel)
  - CNAME www = <DEIN_VERCEL_DNS_HOST>  (z. B. `xxxxx.vercel-dns.com.` – exakten Wert in Vercel Domains kopieren)
  - A api = 85.13.167.233  (ALL‑INKL Server‑IP für die PHP‑API)
  - Entfernen: Wildcard `* CNAME w020e2c0.kasserver.com.` (kann www/api überschreiben und Routing stören)
  - Behalten: MX, SPF (TXT), DKIM (TXT), DMARC (TXT), NS

- DNS‑Propagation abwarten (meist 2–10 Minuten; in seltenen Fällen länger).

---

## 2) ALL‑INKL: Subdomain „api.human-being-band.de“

- Lege in KAS eine Subdomain an:
  - Subdomain: `api.human-being-band.de`
  - Ziel/Webspace (Docroot): `/www/htdocs/<ACCOUNT>/human-being-band.de/`  (dort liegt `/server/api`)
  - SSL: Let’s Encrypt aktivieren (nach Aktivierung kann "SSL erzwingen" optional wieder auf Ja)

- Prüfe anschließend direkt im Browser:
  - `https://api.human-being-band.de/server/api/content.php`  → erwartet JSON (Status 200)

---

## 3) ALL‑INKL: API‑Konfiguration (.htaccess und .env)

Datei: `server/api/.htaccess`

Wichtigste Punkte:
- Erlaube gültige Origins (lokal + live):
  ```apache
  <IfModule mod_headers.c>
    Header always set Access-Control-Allow-Credentials "true"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, If-Match, X-Requested-With, Accept, Origin, Cache-Control"
    Header always set Vary "Origin"
    Header always set Access-Control-Max-Age "86400"

    SetEnvIfNoCase Origin "^(.*)$" REQ_ORIGIN=$1
    SetEnvIfNoCase Origin "^http://localhost:5173$" ORIGIN_OK=1
    SetEnvIfNoCase Origin "^https://localhost:5173$" ORIGIN_OK=1
    SetEnvIfNoCase Origin "^https://human-being-band.de$" ORIGIN_OK=1
    SetEnvIfNoCase Origin "^https://www.human-being-band.de$" ORIGIN_OK=1

    Header always set Access-Control-Allow-Origin "expr=%{req:Origin}" env=ORIGIN_OK
  </IfModule>
  ```
- Setze die öffentliche Basis‑URL (für Upload‑Links etc.):
  ```apache
  SetEnv BASE_URL https://api.human-being-band.de
  SetEnv UPLOAD_DIR /www/htdocs/<ACCOUNT>/human-being-band.de/uploads
  ```

Datei: `server/.env` (auf dem Server)
- Beispielwerte (keine Secrets commiten):
  ```env
  BASE_URL=https://api.human-being-band.de
  CORS_ALLOWED_ORIGINS=https://www.human-being-band.de,https://human-being-band.de,http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173
  SESSION_NAME=hb_session
  COOKIE_SECURE=true
  COOKIE_SAMESITE=None
  DATA_DIR=/www/htdocs/<ACCOUNT>/human-being-band.de/server/data
  UPLOAD_DIR=/www/htdocs/<ACCOUNT>/human-being-band.de/uploads
  # ADMIN_USERNAME=...
  # ADMIN_PASSWORD_HASH=...
  ```

---

## 4) Vercel: Domains & Redirect

Projekt → Settings → Domains (im richtigen Vercel‑Projekt der App):
- Domains hinzufügen:
  - `human-being-band.de`
  - `www.human-being-band.de`
- Setze **www.human-being-band.de** als **Primary**.
- Aktiviere **Apex → www Redirect** (301). 
- Warte bis beide Domains **Valid** / **SSL** grün sind.

Hinweis: Wenn du die Vercel‑Domains nicht hinzufügst oder die DNS nicht passt, siehst du `DEPLOYMENT_NOT_FOUND` bei Aufruf von human-being-band.de.

---

## 5) Vercel: Environment Variable

- Project → Settings → Environment Variables:
  - `VITE_API_BASE = https://api.human-being-band.de/server/api`
- Danach neu deployen (oder warten bis der nächste Build die Variable übernimmt).

---

## 6) Lokal entwickeln (nur localhost sichtbar)

- Im Repo: `.env.local`
  ```env
  VITE_API_BASE=/server/api
  ```
- Dein Code ruft damit nur `/server/api/...` auf.
- Vite‑Proxy (falls benötigt) leitet diese Pfade an die API‑Subdomain weiter. 
  Empfohlene Proxy‑Ziele (eine Variante reicht):
  - Stabil über Subdomain:
    ```
    target: 'https://api.human-being-band.de'
    changeOrigin: true
    secure: false   # für lokale Tests ok
    ```
  - Alternativ über KAS‑Hostname (unabhängig vom Apex‑DNS):
    ```
    target: 'https://human-being-band.de.<ACCOUNT>.kasserver.com'
    changeOrigin: true
    secure: false
    headers: { host: 'human-being-band.de' }
    ```

- Dev starten: `npm run dev` → Browser: `http://localhost:5173`

---

## 7) Verifikation (Check‑Liste)

1) DNS
- `A @ = 76.76.21.21`
- `CNAME www = <vercel-dns-host>`
- `A api = 85.13.167.233`
- Wildcard `*` entfernt

2) Vercel Domains
- `www.human-being-band.de` = Primary, Valid/SSL grün
- `human-being-band.de` = vorhanden, Redirect → www aktiv

3) API erreichbar
- `https://api.human-being-band.de/server/api/content.php` → 200 + JSON

4) Live‑Seite
- `https://www.human-being-band.de` lädt App
- Netzwerktab: API‑Calls gehen an `https://api.human-being-band.de/server/api/...` und liefern 200

5) Lokal
- `.env.local` gesetzt (siehe oben)
- `npm run dev` → Requests an `/server/api/...` kommen durch (Status 200)

---

## 8) Troubleshooting

- "DEPLOYMENT_NOT_FOUND" auf human-being-band.de
  - Domain zeigt auf Vercel, aber nicht im richtigen Projekt hinzugefügt/validiert
  - Lösung: Domains in Vercel hinzufügen, www als Primary setzen, Apex→www Redirect aktivieren, DNS prüfen

- 308 Redirects / CORS Missing Allow Origin
  - Du triffst die falsche Domain (z. B. `human-being-band.de/server/api` statt `api.*`) ODER SSL‑Erzwingen greift
  - Lösung: Frontend `VITE_API_BASE` → `https://api.human-being-band.de/server/api`, CORS‑Origins prüfen, SSL erst aktivieren wenn Zertifikat gültig

- 403 Forbidden
  - CORS‑Whitelist fehlt (`localhost:5173`) oder ein Rewrite blockiert `/server/api`
  - Lösung: `server/api/.htaccess` Origins ergänzen; Root‑Redirects prüfen und Ausnahmen für `/server/api`/Host `api.*` setzen

- TLS/Handshake Fehler lokal
  - Zertifikat der Subdomain noch nicht aktiv oder Proxy‐Target falsch (HTTPS vs. HTTP)
  - Lösung: kurzzeitig `secure:false` nutzen, HTTPS erst nach erfolgreichem Zertifikat erzwingen

---

## 9) Rollback / Varianten

- Nur ALL‑INKL (ohne Vercel):
  - A @ → 85.13.167.233
  - Entferne Vercel‑Domains
  - Frontend statisch bei ALL‑INKL deployen

- Nur Vercel (ohne PHP‑API):
  - Entferne API‑Aufrufe oder stelle die API auf Serverless/FaaS um

---

## 10) Notizen / Platzhalter
- `<ACCOUNT>` = dein ALL‑INKL Account‑Kürzel (z. B. `w020e2c0`)
- `<vercel-dns-host>` = der von Vercel angezeigte CNAME‑Zielhost

Fertig! Folge den Schritten oben in der Reihenfolge. Wenn eine Prüfung fehlschlägt, gehe zur Troubleshooting‑Sektion und korrigiere die jeweils passende Einstellung.
