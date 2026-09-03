# Cisco Final Exam Simulator

Lokale, offline-fähige Webanwendung zur realistischen Simulation von Cisco-Abschlussprüfungen (CCNA etc.). Läuft vollständig im Browser, keine Cloud-Abhängigkeit, keine Analytics.

## Starten

```bash
npm install
npm run dev
```

Öffnet unter `http://localhost:5173`. Für einen Produktions-Build:

```bash
npm run build
npm run preview
```

Tests ausführen:

```bash
npm run test
```

## Funktionsumfang

- **Exam Mode**: feste Fragenzahl, Zeitlimit, zufällige Fragen/Reihenfolge, keine Duplikate, Markieren, Navigation, Fortschrittsanzeige, automatische Abgabe bei Zeitablauf, Prüfungsstatus übersteht einen Reload (Timer basiert auf einem absoluten Endzeitpunkt, nicht auf einem Countdown-State).
- **Lernmodus**: sofortiges Feedback inkl. Erklärung, kein Zeitlimit.
- **Prüfungsvorlagen**: Vollständig, Zufall, Kategorie, Schwäche, Fehlerprüfung (falsch beantwortete Fragen), Benutzerdefiniert (Kategorien/Anzahl/Zeit/Schwierigkeit).
- **Auswertung**: Gesamtergebnis, Prozentwert, bestanden/nicht bestanden, Kategorie-Breakdown, Frage-für-Frage-Review mit Filtern (alle/richtig/falsch/unbeantwortet, nach Kategorie).
- **Statistik**: Anzahl Prüfungen, Erfolgsquote, Durchschnitt, beste/schlechteste Prüfung, Kategorie-Performance, Verlauf aller Prüfungen, Ø Bearbeitungszeit.
- **Schwächen erkennen**: 🔴/🟡/🟢-Einstufung je Kategorie, direkter Start eines "Schwächen-Exams".
- **Import/Export**: JSON-Import mit Validierung (siehe Schema unten) und verständlichen Fehlermeldungen, Export von Fragenkatalog und Ergebnissen als JSON.
- **Einstellungen**: Fragen pro Prüfung, Prüfungszeit, Bestehensgrenze, Zufalls-Flags — alles persistiert.
- **Persistenz**: LocalStorage, kein Backend nötig. Kein Datenversand an Dritte.

## Fragenkatalog-Schema

```jsonc
{
  "id": "Q001",                  // eindeutig, Pflichtfeld
  "category": "Routing",         // Pflichtfeld, wird automatisch als Kategorie erkannt
  "question": "Which protocol …",// Pflichtfeld
  "type": "single_choice",       // "single_choice" | "multiple_choice" | "true_false"
  "options": [
    { "id": "A", "text": "OSPF" },
    { "id": "B", "text": "BGP" },
    { "id": "C", "text": "RIP" },
    { "id": "D", "text": "EIGRP" }
  ],
  "correct_answers": ["B"],      // Pflichtfeld, muss auf existierende option.id verweisen
  "explanation": "…",            // optional
  "difficulty": "medium"         // optional: "easy" | "medium" | "hard"
}
```

Import akzeptiert entweder ein reines Array `[ {...}, {...} ]` oder `{ "questions": [ {...} ] }`.

Bei `true_false` können `options` weggelassen werden — sie werden automatisch als `true`/`false` ergänzt (keine Erfindung von Inhalten, nur strukturelle Ergänzung).

**Validierungsregeln** (Import bricht pro Frage einzeln ab, nicht für den gesamten Katalog):

- `id`, `category`, `question`, `type`, `options` (≥2), `correct_answers` (≥1) müssen vorhanden sein.
- `correct_answers` darf ausschließlich auf vorhandene `options[].id` verweisen.
- `single_choice` muss genau eine korrekte Antwort haben.
- Doppelte `id`s im Katalog werden abgelehnt (erste gewinnt, weitere werden als Fehler gemeldet).

Fehlerhafte Datensätze werden nicht verändert oder ergänzt, sondern mit einer präzisen Fehlermeldung gemeldet, z. B.:

```
Q042: correct_answers enthält Antwort "E", aber es existiert keine Antwort E.
```

## Eigenen Fragenkatalog verwenden

1. Seite **Fragenkatalog** öffnen.
2. **JSON-Datei auswählen** und deine Datei laden.
3. Import-Zusammenfassung prüfen (Anzahl importiert, Kategorien, ggf. Fehler).
4. Demo-Fragen können über den Schalter "Demo-Fragen anzeigen" ein-/ausgeblendet werden; sie werden nie mit deinen Daten vermischt dargestellt, sondern klar als `isDemo` geführt.

Die Anwendung verwendet ausschließlich die von dir gelieferten Fragen — es werden keine zusätzlichen Fragen, Antworten oder Erklärungen erfunden.

## Projektstruktur

```
src/
├── components/   Layout/Navigation
├── pages/        Dashboard, ExamSetup, ExamRunner, Result*, Weaknesses, Statistics, Questions, Settings
├── data/         Demo-Fragenkatalog
├── hooks/        useExamTimer (reload-sicher)
├── services/     Exam-Engine, Import-Validierung, Storage-Wrapper (+ Tests)
├── store/        Zustand-Stores: questions, settings, results, examSession
├── types/        zentrales Datenmodell
└── App.tsx
```

## Selbsttest-Checkliste

- [x] Prüfung kann gestartet werden (alle 6 Vorlagen)
- [x] Fragen werden zufällig ausgewählt, keine Duplikate (unit-getestet)
- [x] Single- und Multiple-Choice-Bewertung korrekt (exaktes Set-Matching, unit-getestet)
- [x] Timer läuft zuverlässig und übersteht einen Reload (Zeit wird aus `endsAt`-Timestamp abgeleitet)
- [x] Automatische Abgabe bei Ablauf der Zeit
- [x] Ergebnisanalyse mit Filtern funktioniert
- [x] Statistiken werden lokal gespeichert und aktualisiert
- [x] JSON-Import inkl. Fehlerbehandlung funktioniert (unit-getestet)
- [x] Export von Fragen und Ergebnissen funktioniert
- [x] Anwendung baut fehlerfrei (`tsc --noEmit`, `vite build`) und läuft ohne Internetzugriff
- [x] 36 automatisierte Tests (Scoring, Selection, Import-Validierung, Timer) — `npm run test`
