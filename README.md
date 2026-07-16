# ponte · puente

Flashcard italiano ↔ spagnolo con ripetizione dilazionata (spaced repetition), pensata per essere semplice, veloce e utilizzabile ovunque — anche offline.

## Caratteristiche

- **Ripetizione dilazionata** con algoritmo in stile SM-2 (facilità, intervallo, ripetizioni)
- **Due direzioni di studio**: IT→ES, ES→IT, o miste
- **Pronuncia audio** delle parole (Web Speech API, nessun servizio esterno richiesto)
- **Modalità scrittura**: digita la traduzione invece di girare la carta, per un richiamo attivo più efficace
- **Frasi d'esempio e note** per dare contesto a ogni coppia di parole
- **Categorie** per organizzare e filtrare le carte per argomento
- **Aggiunta in blocco** da testo (`italiano ; spagnolo ; nota`)
- **Statistiche**: precisione, striscia di giorni consecutivi, attività degli ultimi 14 giorni, stato del mazzo
- **Sincronizzazione via GitHub Gist** (opzionale) per avere le carte su più dispositivi
- **Backup locale** in JSON, indipendente dalla sincronizzazione
- **Installabile come app** (PWA) con supporto offline tramite service worker
- **Tema chiaro/scuro** automatico o manuale

Tutti i dati restano sul dispositivo (`localStorage`) a meno che tu non colleghi esplicitamente un Gist GitHub per la sincronizzazione.

## Utilizzo

Non serve alcuna build: è un'app statica.

1. Scarica o clona la cartella del progetto
2. Apri `index.html` in un browser, oppure servila con un piccolo server locale, ad esempio:
   ```bash
   npx serve .
   # oppure
   python3 -m http.server 8000
   ```
3. Per installarla come app (consigliato su mobile): apri il sito nel browser e scegli "Aggiungi alla schermata Home" (iOS/Safari) o "Installa app" (Android/Chrome, desktop Chrome/Edge)

### Sincronizzazione tra dispositivi

Nelle impostazioni (icona ingranaggio) puoi collegare un [Gist GitHub privato](https://github.com/settings/tokens/new?scopes=gist):

1. Crea un token con permesso `gist`
2. Incollalo nelle impostazioni e salva: verrà creato automaticamente un nuovo Gist
3. Su un altro dispositivo, incolla lo stesso token e l'ID del Gist per collegarti allo stesso mazzo di carte

Il token viene salvato solo in locale (`localStorage`) e usato esclusivamente per chiamare l'API di GitHub direttamente dal browser.

## Struttura del progetto

```
.
├── index.html        punto d'ingresso dell'app
├── manifest.json      manifest PWA (installazione, icona, tema)
├── sw.js               service worker per il funzionamento offline
├── icon.svg            icona dell'app
├── css/
│   └── style.css       stili
└── js/
    └── app.js           logica dell'app (dati, SRS, rendering, sincronizzazione)
```

## Formato dei dati

Ogni carta ha questa forma (vedi `js/app.js`):

```json
{
  "id": "c_...",
  "it": "finestra",
  "es": "ventana",
  "note": "",
  "example": "Ho lasciato la finestra aperta.",
  "tags": ["casa"],
  "createdAt": 0,
  "srsItEs": { "ease": 2.5, "interval": 0, "reps": 0, "due": 0, "lastReview": null },
  "srsEsIt": { "ease": 2.5, "interval": 0, "reps": 0, "due": 0, "lastReview": null }
}
```

Il backup (Impostazioni → Backup locale → Esporta JSON) esporta l'intero oggetto dati, incluse le carte e lo storico dei ripassi.

## Compatibilità

Richiede un browser moderno con supporto a `localStorage`, `fetch` e (facoltativamente, per l'audio) `speechSynthesis`. Testata su Chrome, Safari e Firefox recenti, desktop e mobile.

## Licenza

Distribuito con licenza MIT — vedi [LICENSE](./LICENSE).
