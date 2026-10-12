// blocco.js — gira DENTRO la pagina di Instagram (mondo MAIN), prima dei suoi script.
//
// Ogni video deve prendersi il permesso con un clic. Il permesso è del VIDEO, non del momento: l'estensione
// che c'era prima dava 2 secondi dopo il clic, e Instagram — che fa partire il video quando l'ha caricato —
// arrivava tardi e si vedeva bloccare anche quelli voluti. Il permesso si perde quando il video esce dallo
// schermo o cambia contenuto (Instagram ricicla i <video>).
//
// Il bottone vive DENTRO il riquadro del video, non in un livello sopra la pagina: così scorre con lo scroll
// del browser, senza codice che lo rincorra (la prima versione lo riposizionava a ogni fotogramma e restava
// indietro di uno). Per la stessa ragione una finestra di Instagram aperta sopra il feed lo copre da sé.
(() => {
  if (window.__clicPerGuardare) return;
  window.__clicPerGuardare = true;

  const impostazioni = { attiva: true, anche_storie: false };
  const permessi = new WeakSet();   // video che hai cliccato
  const fermati = new Set();        // video a cui è stata negata la partenza
  const bottoni = new Map();        // video → il suo bottone
  const playVero = HTMLMediaElement.prototype.play;

  const nelleStorie = () => location.pathname.startsWith('/stories/');
  const deveFermare = (v) =>
    impostazioni.attiva && !permessi.has(v) && !(nelleStorie() && !impostazioni.anche_storie);

  // ── 1. le partenze ─────────────────────────────────────────────────────────────
  // Quella chiesta dal codice di Instagram: lo stesso errore che dà il browser quando blocca l'autoplay,
  // che Instagram sa gestire (tiene l'anteprima e aspetta) senza credere che il video stia andando.
  HTMLMediaElement.prototype.play = function () {
    if (this instanceof HTMLVideoElement && deveFermare(this)) {
      ferma(this);
      return Promise.reject(new DOMException('Clic per guardare: parte solo col clic', 'NotAllowedError'));
    }
    return playVero.call(this);
  };

  // La rete di sicurezza: qualunque partenza sfuggita (attributo autoplay, altre strade).
  document.addEventListener('play', (e) => {
    const v = e.target;
    if (v instanceof HTMLVideoElement && deveFermare(v)) { v.pause(); ferma(v); }
  }, true);

  // Il bottone va via solo se il video sta andando davvero: dopo una partenza fermata dalla rete di sicurezza
  // il browser manda lo stesso «playing», ma il video è già di nuovo in pausa e il bottone deve restare.
  document.addEventListener('playing', (e) => {
    const v = e.target;
    if (v instanceof HTMLVideoElement && !v.paused) togli(v);
  }, true);

  // Un video che cambia contenuto è un video nuovo: il permesso non passa.
  document.addEventListener('emptied', (e) => { if (e.target instanceof HTMLVideoElement) permessi.delete(e.target); }, true);

  // ── 2. il permesso si perde quando il video esce dallo schermo ──────────────────
  const osservatore = new IntersectionObserver((voci) => {
    for (const { target, isIntersecting } of voci) if (!isIntersecting) permessi.delete(target);
  });
  const osservati = new WeakSet();

  function ferma(v) {
    // Scorrendo il feed Instagram butta via i video che hai superato: si dimenticano anche qui, o in
    // un'ora di scroll l'elenco terrebbe in vita centinaia di video morti.
    for (const w of fermati) if (!w.isConnected) { fermati.delete(w); togli(w); }
    fermati.add(v);
    if (!osservati.has(v)) { osservati.add(v); osservatore.observe(v); }
    mostra(v);
  }

  function lascia(v) {
    permessi.add(v);
    fermati.delete(v);
    togli(v);
    playVero.call(v).catch(() => { v.muted = true; playVero.call(v).catch(() => {}); });
  }

  // ── 3. il bottone ──────────────────────────────────────────────────────────────
  const STILE = `
    :host { all: initial; position: absolute; inset: 0; z-index: 2147483000; pointer-events: none;
      display: grid; place-items: center; container-type: size; }
    button { all: unset; box-sizing: border-box; pointer-events: auto; cursor: pointer;
      width: 72px; height: 72px; border-radius: 50%; display: grid; place-items: center;
      background: rgb(16 16 18 / .5); -webkit-backdrop-filter: blur(12px) saturate(1.4); backdrop-filter: blur(12px) saturate(1.4);
      box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / .8), 0 6px 20px rgb(0 0 0 / .22);
      transition: transform .16s cubic-bezier(.2,.7,.3,1), background-color .16s ease;
      animation: entra .2s ease-out both; }
    button:hover { transform: scale(1.06); background: rgb(16 16 18 / .66); }
    button:active { transform: scale(.95); }
    button:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
    svg { width: 100%; height: 100%; display: block; }
    @container (max-width: 280px) or (max-height: 280px) { button { width: 54px; height: 54px; } }
    @container (max-width: 140px) or (max-height: 140px) { button { display: none; } }
    @keyframes entra { from { opacity: 0; transform: scale(.9); } }
    @media (prefers-reduced-motion: reduce) { button { animation: none; transition: none; } }`;
  // Il triangolo è centrato sul suo BARICENTRO, non sul rettangolo che lo contiene: un triangolo che punta a destra
  // ha il peso a sinistra, e centrato «a scatola» sembra spostato. Baricentro = 1/3 della larghezza dalla base,
  // quindi base a 12 − 8,5/3 = 9,17 e punta a 17,67 (viewBox 24 = il cerchio intero). Niente margini nel CSS.
  const ICONA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.17 7 L17.67 12 L9.17 17 Z" fill="#fff" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  // Dove appoggiarlo: il più grande antenato che ha ancora le misure del video (lì Instagram tiene anche
  // i suoi comandi), così il bottone sta sopra a quelli e sotto a qualunque finestra aperta sopra il feed.
  function riquadro(v) {
    const r = v.getBoundingClientRect();
    let c = v.parentElement;
    for (let p = c && c.parentElement, i = 0; p && i < 8; p = p.parentElement, i++) {
      const q = p.getBoundingClientRect();
      if (Math.abs(q.width - r.width) > 4 || Math.abs(q.height - r.height) > 4) break;
      c = p;
    }
    if (c && getComputedStyle(c).position === 'static') c.style.position = 'relative';
    return c;
  }

  // React a volte ricostruisce il riquadro e porta via il bottone: si rimette alla richiesta dopo del video.
  function mostra(v) {
    if (!v.isConnected || !v.paused || !deveFermare(v)) return;
    const vecchio = bottoni.get(v);
    if (vecchio && vecchio.isConnected) return;
    const dove = riquadro(v);
    if (!dove) return;
    const host = document.createElement('clic-per-guardare');
    const ombra = host.attachShadow({ mode: 'closed' });
    ombra.innerHTML = `<style>${STILE}</style><button type="button" aria-label="Riproduci il video">${ICONA}</button>`;
    const b = ombra.querySelector('button');
    const zitto = (e) => { e.stopPropagation(); e.preventDefault(); };
    b.addEventListener('pointerdown', zitto);
    b.addEventListener('mousedown', zitto);
    b.addEventListener('click', (e) => { zitto(e); lascia(v); });
    dove.appendChild(host);
    bottoni.set(v, host);
  }

  function togli(v) {
    const host = bottoni.get(v);
    if (host) { host.remove(); bottoni.delete(v); }
  }

  // Un clic VERO dentro un video fermato vale come permesso, anche sul triangolo di Instagram: nel feed
  // un tocco sul video accende l'audio e non lo fa partire, quindi lo facciamo partire noi.
  document.addEventListener('click', (e) => {
    if (!e.isTrusted || (e.target instanceof Element && e.target.localName === 'clic-per-guardare')) return;
    for (const v of fermati) {
      if (!v.isConnected) { fermati.delete(v); continue; }
      const r = v.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
      const sopra = document.elementFromPoint(e.clientX, e.clientY);
      const finestra = sopra && sopra.closest('[role="dialog"],[aria-modal="true"]');
      if (finestra && !finestra.contains(v)) continue;
      lascia(v);
    }
  }, true);

  // ── 4. le impostazioni arrivano dal ponte (che può leggere lo spazio dell'estensione) ──
  document.addEventListener('clic-per-guardare:impostazioni', (e) => {
    try { Object.assign(impostazioni, JSON.parse(e.detail)); } catch { return; }
    for (const v of fermati) { if (deveFermare(v)) mostra(v); else togli(v); }
  });
  document.dispatchEvent(new CustomEvent('clic-per-guardare:pronto'));
})();
