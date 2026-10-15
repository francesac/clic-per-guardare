// filtro.js — fa sparire dal feed e dai reel i post degli argomenti che hai spento (argomenti.js).
//
// Gira nel mondo isolato dell'estensione, non dentro la pagina: non tocca i video, legge solo quello che il post
// dice di sé — autore, didascalia, hashtag, la descrizione automatica che Instagram dà alle foto («May be an image
// of … playing soccer») — e lo confronta con le parole di argomenti.js. Niente esce dal computer.
//
// Lavora solo dove scorri senza aver scelto tu: il feed (/) e i reel (/reels/…). Un post che apri tu — un link,
// un profilo, una finestra sopra il feed — resta com'è.
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

  // ── 1. le parole ─────────────────────────────────────────────────────────────────
  // Tutto minuscolo e senza accenti, ogni segno diventa uno spazio: «#ForzaNapoli!» → « forzanapoli ».
  // Si cerca « parola », con gli spazi attorno, così «gol» non scatta dentro «golf» né «inter» dentro «internet».
  const riduci = (s) => ' ' + s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  const prepara = (lista) => (lista || []).map((p) => (/[a-z0-9]/i.test(p) ? { p: riduci(p), emoji: false } : { p, emoji: true }));
  const DIZIONARI = Object.fromEntries(Object.entries(ARGOMENTI).map(([chiave, a]) => [chiave, {
    forti: prepara(a.forti), ambigui: prepara(a.ambigui), contesto: prepara(a.contesto),
    eccezioni: (a.eccezioni || []).map(riduci), account: new Set(a.account || []),
  }]));
  const trova = (voci, testo, grezzo) => voci.filter(({ p, emoji }) => (emoji ? grezzo : testo).includes(p)).map(({ p }) => p.trim());

  // Basta una parola forte · o un account del giro · o due parole di contesto diverse · o una di contesto
  // insieme a un nome ambiguo («gol» + «Napoli»). I nomi ambigui da soli non bastano mai.
  function giudica(testo, grezzo, autori) {
    for (const [chiave, d] of Object.entries(DIZIONARI)) {
      if (!impostazioni['nascondi_' + chiave]) continue;
      let t = testo;
      for (const e of d.eccezioni) t = t.split(e).join(' ');
      const account = autori.filter((a) => d.account.has(a));
      if (account.length) return { chiave, perche: account.map((a) => '@' + a) };
      const forti = trova(d.forti, t, grezzo);
      if (forti.length) return { chiave, perche: forti };
      const contesto = trova(d.contesto, t, grezzo);
      const ambigui = trova(d.ambigui, t, grezzo);
      if (contesto.length >= 2 || (contesto.length && ambigui.length)) return { chiave, perche: [...contesto, ...ambigui] };
    }
    return null;
  }

  // ── 2. i post ───────────────────────────────────────────────────────────────────
  const qui = () => location.pathname === '/' || location.pathname.startsWith('/reels/');

  // Nel feed un post è un <article>. Nei reel è la «diapositiva» che contiene un video solo: si risale dal
  // video finché il genitore ne contiene più d'uno, o finché il genitore è la colonna che scorre.
  function postDi(v) {
    const art = v.closest('article');
    if (art) return art;
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
    const esito = giudica(riduci(grezzo), grezzo, autori);
    if (!esito) return;
    post.setAttribute(SEGNO, esito.chiave);
    post.querySelectorAll('video').forEach((v) => v.pause());
    console.info(`[Clic per guardare] nascosto un post di ${autori[0] ? '@' + autori[0] : '?'} (${esito.chiave}: ${esito.perche.join(', ')})`);
    conta(post);
  }

  function giro() {
    if (!impostazioni.attiva || !qui()) return;
    for (const a of document.querySelectorAll('article')) esamina(a);
    if (location.pathname.startsWith('/reels/')) {
      for (const v of document.querySelectorAll('video')) { const p = postDi(v); if (p) esamina(p); }
    }
  }

  function mostraTutti() {
    for (const p of document.querySelectorAll(`[${SEGNO}]`)) p.removeAttribute(SEGNO);
  }

  // ── 3. quanti oggi (lo legge il pannello) ───────────────────────────────────────────
  function conta(post) {
    if (contati.has(post)) return;
    contati.add(post);
    const oggi = new Date().toLocaleDateString('sv');   // 2026-10-15
    chrome.storage.local.get({ nascosti: { giorno: oggi, n: 0 } }, ({ nascosti }) => {
      const n = nascosti.giorno === oggi ? nascosti.n + 1 : 1;
      chrome.storage.local.set({ nascosti: { giorno: oggi, n } });
    });
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
    impostazioni = imp;
    mostraTutti();   // si riparte da capo: un argomento spento fa tornare i suoi post
    letti = new WeakMap();
    giro();
  }

  chrome.storage.sync.get(PREDEFINITE, applica);
  chrome.storage.onChanged.addListener((_, area) => { if (area === 'sync') chrome.storage.sync.get(PREDEFINITE, applica); });
})();
