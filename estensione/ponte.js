// ponte.js — gira nel mondo isolato dell'estensione: legge le impostazioni salvate
// e le passa a blocco.js, che sta dentro la pagina e da lì non le può leggere.
const PREDEFINITE = { attiva: true, anche_storie: false };

function manda() {
  chrome.storage.sync.get(PREDEFINITE, (imp) => {
    document.dispatchEvent(new CustomEvent('clic-per-guardare:impostazioni', { detail: JSON.stringify(imp) }));
  });
}

document.addEventListener('clic-per-guardare:pronto', manda);
chrome.storage.onChanged.addListener((_, area) => { if (area === 'sync') manda(); });
manda();
