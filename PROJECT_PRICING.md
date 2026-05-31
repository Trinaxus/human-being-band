# Projektbewertung & Preisfindung

Dieses Dokument hilft, den Wert der Band‑Website transparent zu machen und eine faire Preisfindung zu treffen.

## Kurzfassung
- Umsetzungszeit (sichtbare Phase): ca. 5 Arbeitstage (≈ 35–45 Stunden, je nach Puffer)
- Marktübliche Stundensätze (DE/EU, Freelance): 60–120 € / Std (typisch 75–95 €)
- Vorschlag „Friends & Family“ (Band hat wenig Budget): Paketpreise weiter unten

## Marktübliche Sätze (Orientierung)
- Junior / Low‑Budget: 50–70 € / Std
- Solide Mid‑Level (üblich): 70–95 € / Std
- Senior / Spezialisiert: 95–130+ € / Std
Hinweis: Inklusive sind nicht nur Coding‑Stunden, sondern auch Konzeption, Abstimmung, Testing, Deploy‑Vorbereitung und Dokumentation.

## Umfang & Leistung
- Modernes Frontend (React + TypeScript, Tailwind), Dark/Light‑Theme
- Admin‑Bereich: Pflege von Galerien, Upload‑Scan, Whitelist via metadata.json
- Server‑APIs (PHP): Scan & physisches Löschen von „Extra‑Dateien“; CORS & Pfad‑Validierung
- UX/UI‑Anpassungen (Buttons, Kontraste, Light‑Mode), Routing‑Fixes (Rechtliches als SPA)
- Dokumentation: STYLEGUIDE.md, BAND_README.md

Hinweis: Die sichtbare 5‑Tage‑Umsetzung steht auf bereits vorhandenen Bausteinen (Code‑Module, Projektstruktur, Erfahrung). Diese Vorleistungen reduzieren die aktuelle Umsetzungszeit, sind aber Teil des Gesamtwerts.

## Aufwandsschätzung (5 Tage Beispiel)
- Tag 1 – Konzeption & Setup (6–8h)
  - Struktur klären, Zieldefinition, lokales Setup, Basis‑Styles, Theme‑Rahmen
- Tag 2 – Frontend Kern (7–8h)
  - Admin‑UI, Galerie‑Darstellung, Upload‑Scan‑Integration (Client)
- Tag 3 – Server & Integrationen (7–8h)
  - PHP‑Endpoints (scan_gallery, delete_uploads), Env/CORS, robuste Pfadauflösung
- Tag 4 – Whitelist‑Logik & Reports (7–8h)
  - metadata.json‑Whitelist, Scan‑Report mit Statusfarben, URL‑only‑Fälle
- Tag 5 – Quality, Docs & Feinschliff (6–8h)
  - Testing, Bugfixes, STYLEGUIDE/BAND_README, kleinere UI‑Verbesserungen
Summe: 35–40+ Stunden

Wichtig: Diese Zeitangabe beschreibt die jüngste Implementierungsphase. Vorausgegangen sind Vorarbeiten (Konzept‑Know‑how, wiederverwendbare Komponenten, Tool‑Setup), die in der aktuellen Geschwindigkeit und Qualität stecken.

## Wertbeitrag (warum es sich lohnt)
- Sauberer Content‑Workflow (keine falschen Bilder online, einfache Pflege)
- Schnelle Seite, moderne Optik, mobil optimiert
- Skalierbar (zukünftige Bereiche: Presskit, Termine, Shop, Newsletter)
- Dokumentiert (Style‑Guide, Laien‑README)

## Preismodelle (Vorschlag)
- Option A – „Standard“ (ohne Freundschaftsrabatt)
  - 40h × 85 € = 3.400 € netto
- Option B – „Friends & Family“ (empfohlen für Band)
  - Pauschal: 1.900–2.300 € netto (≈ 40–55% Rabatt)
- Option C – „Minimal“ (nur Kernfeatures, weniger Puffer)
  - Pauschal: 1.400–1.600 € netto

Optional/ergänzend
- Pflege & kleine Änderungen: 60–80 € / Std nach Aufwand
- Wartungspaket (optional):
  - S: 49 € / Monat (1h/Monat inkl., Security/Backups/kleine Fixes)
  - M: 99 € / Monat (2h/Monat inkl., Priorisierung)

## Zahlungsplan (Beispiel)
- 50% bei Abnahme/Go‑Live
- 50% innerhalb von 14 Tagen nach Rechnungsstellung
- Alternativ Raten über 2–3 Monate möglich

## Nächste Schritte
- Paket wählen (A/B/C) und Zahlungsplan bestätigen
- Offene Wünsche priorisieren (z. B. Presskit, Termine, Mehrsprachigkeit erweitern)
- Wartungspaket ja/nein

---
Transparenz: Die oben genannten Raten und Pauschalen sind Vorschläge auf Basis des realisierten Umfangs (5 Tage sichtbare Umsetzung) plus eingebrachte Vorleistungen (Bausteine, Erfahrung, Tooling). Ziel ist ein fairer Ausgleich zwischen professionellem Aufwand und der finanziellen Lage der Band.

## Reuse & Tooling (Wertbeitrag außerhalb der 5 Tage)
- Wiederverwendung: Bestehende Projekt‑Bausteine, bewährte Struktur (React/TS/Tailwind), konfigurierter Admin‑Rahmen.
- Abos/Tools: Entwicklungs‑Subscriptions (z. B. AI/Windsurf) unterstützen Qualität und Tempo.
- Erfahrung: Vorwissen aus ähnlichen Projekten verkürzt Umsetzung, senkt Risiko, erhöht Stabilität.
