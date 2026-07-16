# Changelog

Tutte le modifiche rilevanti al progetto sono documentate qui.
Il formato segue liberamente [Keep a Changelog](https://keepachangelog.com/it/1.0.0/).

## [Non rilasciato]

### Modificato
- Le coppie del mazzo di partenza sono state spostate da `js/app.js` a un file dedicato `js/cards.js`, per separare i dati dalla logica
- Mazzo di partenza ampliato con oltre 130 nuove coppie di livello B2 (lavoro, ambiente, tecnologia, società, politica, media, emozioni, salute, viaggi, relazioni, connettivi, verbi, aggettivi, natura, cibo), con note sui falsi amici più insidiosi

## [1.1.0] - 2026-07-16

### Aggiunto
- Pronuncia audio delle parole (Web Speech API) con attivazione automatica opzionale al giro della carta
- Modalità scrittura: digitare la traduzione al posto di girare la carta, con confronto tollerante agli errori minori
- Campo "frase d'esempio" per carta
- Categorie/tag per carta, con filtro nella home e nella libreria
- Aggiunta di carte in blocco da testo (`italiano ; spagnolo ; nota`)
- Nuova scheda Statistiche: precisione, miglior striscia, attività degli ultimi 14 giorni, stato del mazzo (consolidate / in apprendimento / non iniziate)
- Backup locale in JSON (esportazione e importazione), indipendente dalla sincronizzazione Gist
- Supporto PWA: manifest, icona, service worker per l'uso offline e l'installazione come app
- Scorciatoie da tastiera durante lo studio (spazio/invio per girare, 1-4 per valutare)

### Corretto
- Apertura del foglio "aggiungi in blocco" che restava sovrapposto al foglio "nuova carta"

## [1.0.0]

### Aggiunto
- Prima versione: flashcard IT/ES con ripetizione dilazionata in stile SM-2
- Studio con carte girevoli e trascinamento (swipe) per valutare la risposta
- Libreria delle carte con ricerca, modifica ed eliminazione
- Sincronizzazione opzionale via GitHub Gist
- Tema chiaro/scuro
