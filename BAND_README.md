# Die Website der Band – Einfach erklärt

Dieses Dokument erklärt in einfachen Worten, wie unsere Website aufgebaut ist, wie Inhalte entstehen und warum das Projekt wertvoll und aufwendig ist.

## Was ist das für eine Website?
- Moderne Web‑App statt klassischer, fester HTML‑Seiten.
- Läuft wie eine App im Browser: schnell, flüssig, ohne ständiges Neuladen.
- Inhalte (Texte, Bilder, Videos, Links) kommen aus einer Art „Mini‑CMS“ (Admin‑Bereich + Metadateien auf dem Server).

## Wie funktioniert das technisch – ohne Fachchinesisch
- Es gibt zwei Teile:
  1) Die „App“ (Frontend): Das ist das sichtbare Design und die Bedienung im Browser.
  2) Ein kleiner „Server‑Teil“ (Backend): Der hilft beim Verarbeiten von Uploads, Scans und Speichern.
- Die App holt sich Daten (z. B. Galerie‑Einträge) und zeigt sie schön formatiert an.
- Dadurch können Inhalte aktualisiert werden, ohne eine Seite „neu zu programmieren“.

## Was sieht die Band im Admin‑Bereich?
- Galerien verwalten:
  - „Aus Uploads einlesen“: schlägt neue Dateien vor (aber nur, wenn sie in der zugehörigen metadata.json aufgeführt sind).
  - „Scan‑Report“: vergleicht, was in der Galerie stehen soll (metadata.json), mit dem, was tatsächlich im Ordner liegt. Extra‑Dateien lassen sich sicher löschen.
- Buchungsanfragen, Tickets u. a. Admin‑Funktionen sind zentral erreichbar.

## Wie kommen Inhalte rein?
- Pro Galerie gibt es auf dem Server einen Ordner: `/uploads/Jahr/Galerie/`.
- Darin liegt eine `metadata.json`. Sie beschreibt, welche Bilder/Videos zur Galerie gehören, plus externe Links (YouTube/Instagram).
- Die Website nutzt diese Datei als „Wahrheit“. So bleibt die Galerie sauber – auch wenn im Ordner mehr Dateien liegen.

## Zwei Sprachen (Deutsch & Englisch)
- Inhalte gibt es zweisprachig. Im Admin gibt es deshalb Felder für DE und EN (z. B. Titel/Anreißer/Fließtext).
- Die App zeigt – je nach Sprache – automatisch die passenden Texte an.
- Das erhöht den Aufwand (Pflege/Tests), bringt aber klare Vorteile für internationale Besucher.

## Warum nicht einfach „statische HTML‑Seiten“?
- Flexibilität: Inhalte ändern, ohne alles neu zu bauen.
- Geschwindigkeit: Moderne App lädt nur das Nötige, fühlt sich „app‑artig“ an.
- Wartbarkeit: Klare Trennung von Design, Logik und Inhalten.
- Erweiterbarkeit: Neue Bereiche (z. B. Tour‑Termine, Shop) lassen sich leichter einbauen.

## Was ist der Wert / Aufwand?
- Designsystem + Theming (Hell/Dunkel), einheitliche Komponenten, mobile Optimierung.
- Admin‑Werkzeuge, damit Inhalte ohne Programmierer gepflegt werden können.
- Dateiscan + „Whitelist“ über `metadata.json` schützt vor Fehlern (keine falschen Bilder online).
- Sicherheit: Rollen, Sessions, CORS, geprüfte Serverpfade, Schutz vor versehentlichem Löschen.
- Aufwand steckt in: Konzeption, UI/UX‑Design, Programmierung, Server‑Integration, Tests.

## Wie „wird das gerendert“ (angezeigt)?
- Die App liest Daten (z. B. aus `metadata.json` und dem Admin‑Speicher) und baut daraus die sichtbaren Seiten.
- Beim Wechsel (z. B. Galerie auf/zu) muss nicht alles neu geladen werden – nur die Inhalte.
- Externe Medien (YouTube/Instagram) werden als Links eingebunden.

## Betrieb / Hosting
- Öffentliche Adresse: `https://human-being-band.de`.
- Uploads liegen unter `https://human-being-band.de/uploads/...`.
- Der Serverteil schützt sensible Aktionen (nur Admin darf z. B. Dateien löschen).

## Was tun bei Problemen?
- Galerie zeigt zu viele Bilder: Scan‑Report öffnen, „extra Dateien“ prüfen und löschen.
- Galerie zeigt zu wenige Bilder: Prüfen, ob die gewünschten Dateien in `metadata.json` eingetragen sind.
- Admin meldet einen Fehler: Seite neu laden, erneut testen; wenn es bleibt, Entwickler kontaktieren.

## Erweiterungen – was ist möglich?
- Weitere Seiten/Ansichten (z. B. Presskit, Termine, Shop, Newsletter).
- Automatischer Import von Social‑Feeds.
- Mehrsprachigkeit der Inhalte.

---
Kurz: Wir haben eine robuste, moderne Band‑Website mit Admin‑Bereich gebaut, die Inhalte sauber verwaltet und optisch hochwertig darstellt – mit Werkzeugen, die im Alltag Zeit sparen und Fehler vermeiden.
