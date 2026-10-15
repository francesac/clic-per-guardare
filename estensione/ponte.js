// ponte.js — gira nel mondo isolato dell'estensione: legge le impostazioni salvate
// e le passa a blocco.js, che sta dentro la pagina e da lì non le può leggere.
const PREDEFINITE = { attiva: true, anche_storie: false };

// get(null) le prende tutte, anche gli interruttori degli argomenti (nascondi_calcio…) che servono a setaccio.js
function manda() {
  chrome.storage.sync.get(null, (salvate) => {
    document.dispatchEvent(new CustomEvent('clic-per-guardare:impostazioni', { detail: JSON.stringify({ ...PREDEFINITE, ...salvate }) }));
  });
}

// setaccio.js ha tolto un post: si conta fra i nascosti di oggi, che il pannello mostra
document.addEventListener('clic-per-guardare:nascosto', () => {
  const oggi = new Date().toLocaleDateString('sv');   // 2026-10-15
  chrome.storage.local.get({ nascosti: { giorno: oggi, n: 0 } }, ({ nascosti }) => {
    const n = nascosti.giorno === oggi ? nascosti.n + 1 : 1;
    chrome.storage.local.set({ nascosti: { giorno: oggi, n } });
  });
});

document.addEventListener('clic-per-guardare:pronto', manda);
chrome.storage.onChanged.addListener((_, area) => { if (area === 'sync') manda(); });
manda();
