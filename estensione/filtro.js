// filtro.js — la rete di sicurezza dei reel: se un reel di un argomento spento è sfuggito a setaccio.js
// (che li toglie dai dati prima che Instagram li disegni), lo nasconde nella pagina.
//
// Gira dentro la pagina (mondo MAIN), insieme a setaccio.js: legge quello che il reel dice di sé — autore,
// didascalia, la descrizione automatica delle immagini — e lo passa a giudice.js. Niente esce dal computer.
// Sta nello stesso mondo di setaccio perché Chrome carica argomenti.js e giudice.js una volta sola per pagina:
// elencati anche nel mondo isolato, lì non arrivavano, e questo file si fermava alla prima riga.
//
// ⛔ Solo nei reel, mai nel feed: il feed tiene in pagina una decina di post e misura il posto di ognuno, e un
// post nascosto qui gli sballa il conto (il feed si svuota o torna su da solo). Nel feed lavora solo setaccio.js.
(() => {
  if (globalThis.__clicPerGuardareFiltro) return;
  globalThis.__clicPerGuardareFiltro = true;

  const ARGOMENTI = globalThis.CPG_ARGOMENTI;
  const PREDEFINITE = { attiva: true };
  for (const [chiave, a] of Object.entries(ARGOMENTI)) PREDEFINITE['nascondi_' + chiave] = a.predefinito;
  let impostazioni = { ...PREDEFINITE };

  const SEGNO = 'data-clic-per-guardare-nascosto';
  let letti = new WeakMap();       // post → il testo che aveva l'ultima volta che l'ho letto
  const contati = new WeakSet();   // post già contati fra i nascosti di oggi

  const { giudica } = globalThis.CPG_GIUDICE(ARGOMENTI);

  // ── 2. i post ───────────────────────────────────────────────────────────────────
  const qui = () => location.pathname.startsWith('/reels/');

  // Un reel è la «diapositiva» che contiene un video solo: si risale dal video finché il genitore ne
  // contiene più d'uno, o finché il genitore è la colonna che scorre.
  function postDi(v) {
    let c = v;
    while (c.parentElement && c.parentElement !== document.body) {
      const p = c.parentElement;
      if (p.querySelectorAll('video').length > 1) break;
      const o = getComputedStyle(p).overflowY;
      if (o === 'auto' || o === 'scroll') break;
      c = p;
    }
    return c === v ? null : c;
  }

  // Cosa il post dice di sé. La posizione si toglie («Roma, Lazio, Italia» non è un derby).
  function leggi(post) {
    let grezzo = post.innerText || '';
    for (const l of post.querySelectorAll('a[href*="/explore/locations/"]')) grezzo = grezzo.split(l.innerText).join(' ');
    for (const img of post.querySelectorAll('img[alt]')) if (!img.alt.startsWith('Immagine del profilo')) grezzo += '\n' + img.alt;
    const autori = [];
    for (const a of post.querySelectorAll('a[href^="/"]')) {
      const m = a.getAttribute('href').match(/^\/([a-z0-9._]+)\/(?:reels\/)?(?:\?|$)/i);
      if (m && !autori.includes(m[1].toLowerCase())) autori.push(m[1].toLowerCase());
      if (autori.length >= 3) break;   // autore e coautori stanno in cima; dopo vengono i «Piace a…»
    }
    return { grezzo, autori };
  }

  function esamina(post) {
    if (post.hasAttribute(SEGNO) || post.closest('[role="dialog"]')) return;
    const { grezzo, autori } = leggi(post);
    if (letti.get(post) === grezzo) return;   // già letto così: la didascalia non è cambiata
    letti.set(post, grezzo);
    const esito = giudica(grezzo, autori, impostazioni);
    if (!esito) return;
    post.setAttribute(SEGNO, esito.chiave);
    post.querySelectorAll('video').forEach((v) => v.pause());
    console.info(`[Clic per guardare] nascosto un post di ${autori[0] ? '@' + autori[0] : '?'} (${esito.chiave}: ${esito.perche.join(', ')})`);
    conta(post);
  }

  function giro() {
    if (!impostazioni.attiva || !qui()) return;
    for (const v of document.querySelectorAll('video')) { const p = postDi(v); if (p) esamina(p); }
  }

  function mostraTutti() {
    for (const p of document.querySelectorAll(`[${SEGNO}]`)) p.removeAttribute(SEGNO);
  }

  // ── 3. quanti oggi (lo legge il pannello) ───────────────────────────────────────────
  function conta(post) {
    if (contati.has(post)) return;
    contati.add(post);
    document.dispatchEvent(new CustomEvent('clic-per-guardare:nascosto'));   // lo conta ponte.js
  }

  // ── 4. si parte, e si riguarda quando Instagram aggiunge o cambia qualcosa ─────────────
  const stile = document.createElement('style');
  stile.textContent = `[${SEGNO}] { display: none !important; }`;
  (document.head || document.documentElement).appendChild(stile);

  // Instagram cambia la pagina di continuo: si raccolgono i cambi e si guarda una volta ogni 250 ms.
  let atteso = null;
  new MutationObserver(() => { if (!atteso) atteso = setTimeout(() => { atteso = null; giro(); }, 250); })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  function applica(imp) {
    impostazioni = { ...PREDEFINITE, ...imp };
    mostraTutti();   // si riparte da capo: un argomento spento fa tornare i suoi post
    letti = new WeakMap();
    giro();
  }

  // Le impostazioni le manda ponte.js; fino ad allora vale l'ultima copia lasciata da setaccio.js nel localStorage.
  try { applica(JSON.parse(localStorage.getItem('clic-per-guardare:impostazioni') || '{}')); } catch {}
  document.addEventListener('clic-per-guardare:impostazioni', (e) => { try { applica(JSON.parse(e.detail)); } catch {} });
})();
