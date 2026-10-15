// setaccio.js — toglie i post degli argomenti spenti dai DATI del feed e dei reel, prima che Instagram li disegni.
//
// Perché nei dati e non nella pagina: il feed tiene disegnati solo una decina di post e, al posto di quelli
// usciti dallo schermo, lascia uno spazio lungo quanto si ricorda che fossero. Un post nascosto dopo che
// Instagram l'aveva misurato gli sballava quel conto: il feed si svuotava, o lo scorrimento tornava su da solo.
// Tolto dai dati, il post per Instagram non è mai esistito.
//
// Gira dentro la pagina (mondo MAIN) e si mette davanti a JSON.parse, la porta da cui passano sia la prima
// pagina del feed (scritta nell'HTML) sia quelle che arrivano mentre scorri. Guarda solo i pacchi che
// contengono il feed o i reel; tutto il resto passa com'è.
(() => {
  if (globalThis.__clicPerGuardareSetaccio) return;
  globalThis.__clicPerGuardareSetaccio = true;

  const ARGOMENTI = globalThis.CPG_ARGOMENTI;
  const { giudica } = globalThis.CPG_GIUDICE(ARGOMENTI);

  // Le impostazioni arrivano dal ponte, ma la prima pagina del feed si legge prima che arrivino:
  // per quella vale l'ultima copia lasciata nel localStorage di Instagram (alla prima volta, le predefinite).
  const CASSETTO = 'clic-per-guardare:impostazioni';
  const impostazioni = { attiva: true };
  for (const [chiave, a] of Object.entries(ARGOMENTI)) impostazioni['nascondi_' + chiave] = a.predefinito;
  try { Object.assign(impostazioni, JSON.parse(localStorage.getItem(CASSETTO) || '{}')); } catch {}
  document.addEventListener('clic-per-guardare:impostazioni', (e) => {
    try { Object.assign(impostazioni, JSON.parse(e.detail)); localStorage.setItem(CASSETTO, JSON.stringify(impostazioni)); } catch {}
  });

  // ── i pacchi da guardare: il feed e i reel ─────────────────────────────────────────────
  const PACCO = /xdt_api__v1__(feed__timeline|clips__home)__connection/;

  // Cosa il post dice di sé: didascalia, descrizione automatica delle immagini (che spesso trascrive anche il
  // testo scritto sulla foto), autore e coautori. La posizione no: «Roma, Lazio, Italia» non è un derby.
  function leggi(m) {
    const parti = [m.caption?.text, m.accessibility_caption, ...(m.carousel_media || []).map((c) => c.accessibility_caption)];
    const autori = [];
    for (const u of [m.user, m.owner, ...(m.coauthor_producers || [])]) {
      const nome = u?.username?.toLowerCase();
      if (nome && !autori.includes(nome)) autori.push(nome);
    }
    return { grezzo: parti.filter(Boolean).join('\n'), autori };
  }

  function setaccia(connessione) {
    if (!Array.isArray(connessione?.edges)) return;
    connessione.edges = connessione.edges.filter((edge) => {
      const m = edge?.node?.media;
      if (!m) return true;   // pubblicità, suggerimenti, storie: non sono post, restano
      const { grezzo, autori } = leggi(m);
      const esito = giudica(grezzo, autori, impostazioni);
      if (!esito) return true;
      console.info(`[Clic per guardare] tolto un post di ${autori[0] ? '@' + autori[0] : '?'} (${esito.chiave}: ${esito.perche.join(', ')})`);
      document.dispatchEvent(new CustomEvent('clic-per-guardare:nascosto'));
      return false;
    });
  }

  function cerca(o, profondita) {
    if (!o || typeof o !== 'object' || profondita > 60) return;
    if (Array.isArray(o)) { for (const x of o) cerca(x, profondita + 1); return; }
    for (const k in o) {
      if (PACCO.test(k)) setaccia(o[k]);
      else cerca(o[k], profondita + 1);
    }
  }

  const parse = JSON.parse;
  JSON.parse = function (testo, reviver) {
    const r = parse.call(this, testo, reviver);
    try {
      if (impostazioni.attiva && typeof testo === 'string' && testo.length > 2000 && PACCO.test(testo)) cerca(r, 0);
    } catch {}   // se Instagram cambia forma ai dati, il feed resta com'è: mai rompere la pagina
    return r;
  };
})();
