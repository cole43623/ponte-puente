# Changelog

Tutte le modifiche rilevanti al progetto sono documentate qui.
Il formato segue liberamente [Keep a Changelog](https://keepachangelog.com/it/1.0.0/).

## [Non rilasciato]

### Aggiunto
- Gesto "trascina verso il basso" (drag-to-close) per chiudere i pannelli a tendina dal cellulare o desktop, con variazione dinamica dell'opacità dello sfondo oscurato
- Statistiche per carta (precisione, ripassi totali, volte sbagliata, ultimo ripasso) visibili nella libreria
- Ordinamento delle carte in "Le mie carte" per precisione (dalle più difficili o dalle più consolidate), oltre che per data
- Statistiche per categoria e classifica delle carte più difficili nella scheda Statistiche

### Modificato
- Le coppie del mazzo di partenza sono state spostate da `js/app.js` a un file dedicato `js/cards.js`, per separare i dati dalla logica
- Mazzo di partenza ampliato con oltre 130 nuove coppie di livello B2 (lavoro, ambiente, tecnologia, società, politica, media, emozioni, salute, viaggi, relazioni, connettivi, verbi, aggettivi, natura, cibo), con note sui falsi amici più insidiosi
- Il tasto di pronuncia audio nella libreria riproduce ora lo spagnolo invece dell'italiano

### Corretto
- Rotazione 3D della carta flashcard al semplice click/tocco diretto (precedentemente bloccato per l'assenza della classe CSS `.flipped` e attivabile solo tramite trascinamento)
- Blocco o carte doppie durante la transizione rapida dello swipe (ora le interazioni sono temporaneamente bloccate sulla carta in uscita)
- Focus bloccato sullo sfondo all'apertura delle tendine (ora viene eseguito un blur automatico sugli elementi attivi e il focus si sposta dentro il pannello/settings)
- Le tendine non si chiudevano trascinandole verso il basso perché il gesto veniva "rubato" dallo scroll dello sfondo sottostante; ora lo sfondo resta bloccato e non interagibile finché la tendina è aperta
- Durante il ripasso, sbagliare 2-3 carte di fila poteva creare un ciclo infinito in cui venivano riproposte solo quelle carte, escludendo il resto del mazzo; ora la riproposta viene distanziata in modo variabile e crescente ad ogni errore ripetuto

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
