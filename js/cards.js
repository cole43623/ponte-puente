/* ============================================================
   ponte · puente — mazzo di partenza (seed deck)
   Formato di ogni voce: [italiano, spagnolo, nota, [categorie]]
   - "nota" è opzionale (stringa vuota se non serve)
   - "categorie" è opzionale (array di tag)
   Questo file viene caricato PRIMA di app.js (vedi index.html)
   ed espone l'array globale window.PONTE_SEED_PAIRS.
   ============================================================ */
(function(){
  "use strict";

  const pairs = [
    // ---------- Base (mazzo originale) ----------
    ["ciao","hola","",["base"]],
    ["grazie","gracias","",["base"]],
    ["burro","mantequilla","attenzione: 'burro' in spagnolo significa asino!",["base","falsi amici"]],
    ["asino","burro","falso amico con l'italiano 'burro' (=mantequilla)",["base","falsi amici"]],
    ["macchina","coche","",["base"]],
    ["salire","subir","",["base","verbi"]],
    ["guardare","mirar","",["base","verbi"]],
    ["settimana","semana","",["base"]],
    ["lavoro","trabajo","",["base","lavoro"]],
    ["felice","feliz","",["base","emozioni"]],
    ["stanza","habitación","'stanza' in spagnolo è 'estrofa' (poesia)",["base","falsi amici"]],
    ["subito","enseguida","non confondere con 'subir' (=salire)",["base","falsi amici"]],

    // ---------- Lavoro ed economia (B2) ----------
    ["assumere","contratar","non 'asumir' (=accettare una responsabilità)",["lavoro","falsi amici"]],
    ["licenziare","despedir","",["lavoro"]],
    ["candidarsi","postularse","",["lavoro"]],
    ["colloquio di lavoro","entrevista de trabajo","",["lavoro"]],
    ["stipendio","sueldo","anche 'salario'",["lavoro"]],
    ["scadenza","plazo","anche 'fecha límite'",["lavoro"]],
    ["fattura","factura","",["lavoro"]],
    ["riunione","reunión","",["lavoro"]],
    ["azienda","empresa","",["lavoro"]],
    ["socio","socio","",["lavoro"]],
    ["guadagnare","ganar","",["lavoro","verbi"]],
    ["risparmiare","ahorrar","",["lavoro","verbi"]],
    ["investire","invertir","",["lavoro","verbi"]],
    ["prestito","préstamo","",["lavoro"]],
    ["tassa","impuesto","in spagnolo 'tasa' significa 'tasso/indice', non 'tassa'",["lavoro","falsi amici"]],
    ["bilancio","presupuesto","",["lavoro"]],
    ["fatturato","facturación","",["lavoro"]],
    ["concorrenza","competencia","",["lavoro"]],
    ["sciopero","huelga","",["lavoro","società"]],
    ["disoccupazione","desempleo","",["lavoro"]],

    // ---------- Ambiente ----------
    ["inquinamento","contaminación","",["ambiente"]],
    ["riscaldamento globale","calentamiento global","",["ambiente"]],
    ["rifiuti","residuos","anche 'basura' nell'uso quotidiano",["ambiente"]],
    ["riciclare","reciclar","",["ambiente","verbi"]],
    ["sostenibile","sostenible","",["ambiente","aggettivi"]],
    ["fonte rinnovabile","fuente renovable","",["ambiente"]],
    ["siccità","sequía","",["ambiente"]],
    ["alluvione","inundación","",["ambiente"]],
    ["deforestazione","deforestación","",["ambiente"]],
    ["impronta ecologica","huella ecológica","",["ambiente"]],
    ["risorsa naturale","recurso natural","",["ambiente"]],

    // ---------- Tecnologia ----------
    ["schermo","pantalla","",["tecnologia"]],
    ["caricare","cargar","",["tecnologia","verbi"]],
    ["scaricare","descargar","",["tecnologia","verbi"]],
    ["allegato","archivo adjunto","",["tecnologia"]],
    ["aggiornamento","actualización","",["tecnologia"]],
    ["guasto","avería","",["tecnologia"]],
    ["rete","red","",["tecnologia"]],
    ["dispositivo","dispositivo","",["tecnologia"]],
    ["applicazione","aplicación","",["tecnologia"]],
    ["riservatezza","privacidad","",["tecnologia"]],
    ["minaccia informatica","amenaza informática","",["tecnologia"]],

    // ---------- Società e politica ----------
    ["pregiudizio","prejuicio","",["società"]],
    ["disuguaglianza","desigualdad","",["società"]],
    ["diritti","derechos","",["società"]],
    ["cittadinanza","ciudadanía","",["società"]],
    ["immigrazione","inmigración","",["società"]],
    ["integrazione","integración","",["società"]],
    ["manifestazione","manifestación","",["società"]],
    ["sondaggio","encuesta","",["società"]],
    ["opinione pubblica","opinión pública","",["società"]],
    ["governo","gobierno","",["politica"]],
    ["elezioni","elecciones","",["politica"]],
    ["partito","partido","",["politica"]],
    ["legge","ley","",["politica"]],
    ["riforma","reforma","",["politica"]],
    ["corruzione","corrupción","",["politica"]],
    ["votare","votar","",["politica","verbi"]],

    // ---------- Media ----------
    ["notizia","noticia","",["media"]],
    ["quotidiano","diario","attenzione: come aggettivo 'quotidiano'=cotidiano, non confondere",["media","falsi amici"]],
    ["fonte attendibile","fuente fiable","",["media"]],
    ["censura","censura","",["media"]],
    ["pubblicità","publicidad","",["media"]],
    ["punto di vista","punto de vista","",["media","opinioni"]],

    // ---------- Emozioni e personalità ----------
    ["orgoglioso","orgulloso","",["emozioni"]],
    ["deluso","decepcionado","",["emozioni"]],
    ["invidioso","envidioso","",["emozioni"]],
    ["imbarazzato","avergonzado","attenzione: 'embarazada' in spagnolo significa 'incinta'!",["emozioni","falsi amici"]],
    ["sollevato","aliviado","",["emozioni"]],
    ["affidabile","fiable","anche 'confiable'",["emozioni","aggettivi"]],
    ["testardo","terco","anche 'testarudo'",["emozioni"]],
    ["egoista","egoísta","",["emozioni"]],
    ["generoso","generoso","",["emozioni"]],
    ["ambizioso","ambicioso","",["emozioni"]],
    ["insicuro","inseguro","",["emozioni"]],
    ["coraggioso","valiente","anche 'corajudo' in alcuni paesi",["emozioni"]],

    // ---------- Salute ----------
    ["guarire","sanar","anche 'curarse'",["salute","verbi"]],
    ["ferita","herida","",["salute"]],
    ["ricetta medica","receta médica","",["salute"]],
    ["effetto collaterale","efecto secundario","",["salute"]],
    ["vaccino","vacuna","",["salute"]],
    ["pronto soccorso","urgencias","",["salute"]],
    ["benessere","bienestar","",["salute"]],
    ["chirurgo","cirujano","",["salute"]],
    ["invecchiare","envejecer","",["salute","verbi"]],

    // ---------- Viaggi ----------
    ["prenotare","reservar","",["viaggi","verbi"]],
    ["soggiorno","estancia","",["viaggi"]],
    ["dogana","aduana","",["viaggi"]],
    ["imbarco","embarque","",["viaggi"]],
    ["coincidenza (volo)","conexión (vuelo)","attenzione: 'coincidencia' in spagnolo significa 'caso, combinazione'",["viaggi","falsi amici"]],
    ["valigia","maleta","",["viaggi"]],
    ["destinazione","destino","",["viaggi"]],
    ["itinerario","itinerario","",["viaggi"]],
    ["equipaggio","tripulación","",["viaggi"]],

    // ---------- Relazioni ----------
    ["fidanzato","novio","",["relazioni"]],
    ["rompere (una relazione)","romper (una relación)","",["relazioni"]],
    ["tradire","engañar","anche 'traicionar'",["relazioni","verbi"]],
    ["litigare","discutir","attenzione: 'discutir' in spagnolo spesso significa 'litigare', non solo 'discutere'",["relazioni","falsi amici"]],
    ["riconciliarsi","reconciliarse","",["relazioni","verbi"]],
    ["fiducia","confianza","",["relazioni"]],
    ["geloso","celoso","",["relazioni"]],

    // ---------- Connettivi e lingua da saggio (B2) ----------
    ["tuttavia","sin embargo","",["connettivi"]],
    ["pertanto","por lo tanto","",["connettivi"]],
    ["inoltre","además","",["connettivi"]],
    ["nonostante","a pesar de","",["connettivi"]],
    ["affinché","para que","",["connettivi"]],
    ["sebbene","aunque","",["connettivi"]],
    ["di conseguenza","por consiguiente","",["connettivi"]],
    ["per quanto riguarda","en cuanto a","",["connettivi"]],
    ["in altre parole","en otras palabras","",["connettivi"]],
    ["a tal proposito","al respecto","",["connettivi"]],

    // ---------- Verbi utili (B2) ----------
    ["accorgersi","darse cuenta","",["verbi"]],
    ["sforzarsi","esforzarse","",["verbi"]],
    ["lamentarsi","quejarse","",["verbi"]],
    ["fidarsi","fiarse","anche 'confiar'",["verbi"]],
    ["abituarsi","acostumbrarse","",["verbi"]],
    ["vergognarsi","avergonzarse","",["verbi"]],
    ["preoccuparsi","preocuparse","",["verbi"]],
    ["rimproverare","regañar","anche 'reprochar'",["verbi"]],
    ["sopportare","aguantar","anche 'soportar'",["verbi"]],
    ["evitare","evitar","",["verbi"]],
    ["affrontare","afrontar","anche 'enfrentar'",["verbi"]],
    ["raggiungere","lograr","anche 'alcanzar'",["verbi"]],
    ["ottenere","obtener","",["verbi"]],
    ["fingere","fingir","",["verbi"]],
    ["ingannare","engañar","",["verbi"]],
    ["convincere","convencer","",["verbi"]],
    ["persuadere","persuadir","",["verbi"]],
    ["dubitare","dudar","",["verbi"]],
    ["esigere","exigir","",["verbi"]],
    ["pretendere","exigir","falso amico ingannevole: 'pretender' in spagnolo significa 'fingere' o 'aspirare a', non 'esigere'!",["verbi","falsi amici"]],
    ["realizzare (rendersi conto)","darse cuenta","attenzione: 'realizar' in spagnolo significa solo 'fare/compiere', non 'capire'",["verbi","falsi amici"]],
    ["negare","negar","",["verbi"]],
    ["rifiutare","rechazar","anche 'negarse a'",["verbi"]],

    // ---------- Aggettivi astratti (B2) ----------
    ["inevitabile","inevitable","",["aggettivi"]],
    ["fondamentale","fundamental","",["aggettivi"]],
    ["indispensabile","indispensable","",["aggettivi"]],
    ["superficiale","superficial","",["aggettivi"]],
    ["approfondito","detallado","",["aggettivi"]],
    ["efficace","eficaz","",["aggettivi"]],
    ["efficiente","eficiente","",["aggettivi"]],
    ["imprevedibile","impredecible","",["aggettivi"]],
    ["ingiusto","injusto","",["aggettivi"]],
    ["equo","equitativo","anche 'justo'",["aggettivi"]],
    ["ambiguo","ambiguo","",["aggettivi"]],
    ["controverso","controvertido","",["aggettivi"]],
    ["irrilevante","irrelevante","",["aggettivi"]],
    ["pertinente","pertinente","anche 'relevante'",["aggettivi"]],

    // ---------- Natura ----------
    ["scogliera","acantilado","",["natura"]],
    ["pianura","llanura","",["natura"]],
    ["vallata","valle","",["natura"]],
    ["ghiacciaio","glaciar","",["natura"]],
    ["vulcano","volcán","",["natura"]],
    ["terremoto","terremoto","",["natura"]],

    // ---------- Cibo (sfumature) ----------
    ["assaggiare","probar","",["cibo","verbi"]],
    ["pentola","olla","",["cibo"]],
    ["padella","sartén","",["cibo"]],
    ["ingrediente","ingrediente","",["cibo"]],

    // ---------- Casa ----------
    ["soppalco","altillo","",["casa"]],
    ["candeggina","lejía","in America Latina si usa più spesso 'cloro' per indicare la candeggina",["casa","falsi amici"]],

    // ---------- Musica ----------
    ["ritornello","estribillo","",["musica"]],

    // ---------- Società e politica ----------
    ["ostaggi","rehén","in spagnolo è singolare ('el rehén'/'los rehenes'), non un plurale invariabile come in italiano",["società","politica"]]
  ];

  window.PONTE_SEED_PAIRS = pairs;
})();
