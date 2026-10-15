const ARGOMENTI = globalThis.CPG_ARGOMENTI;
const PREDEFINITE = { attiva: true, anche_storie: false };
for (const [chiave, a] of Object.entries(ARGOMENTI)) PREDEFINITE['nascondi_' + chiave] = a.predefinito;
const attiva = document.getElementById('attiva');
const storie = document.getElementById('anche_storie');
const stato = document.getElementById('stato');

// Un interruttore per ogni argomento di argomenti.js, disegnato come le righe sopra.
const contatore = {};
for (const [chiave, a] of Object.entries(ARGOMENTI)) {
  const riga = document.createElement('label');
  riga.className = 'riga argomento';
  riga.innerHTML = '<span><strong></strong><small></small></span><input type="checkbox" role="switch">';
  riga.querySelector('strong').textContent = a.nome;
  riga.querySelector('small').textContent = a.descrizione;
  const interruttore = riga.querySelector('input');
  interruttore.id = 'nascondi_' + chiave;
  interruttore.addEventListener('change', () => salva({ ['nascondi_' + chiave]: interruttore.checked }));
  document.getElementById('argomenti').appendChild(riga);
}

// Quanti post sono spariti oggi: spariscono senza lasciare traccia, e questo è l'unico modo di sapere che lavora.
const oggi = new Date().toLocaleDateString('sv');
const nascosti = document.createElement('p');
nascosti.className = 'nascosti';
document.getElementById('argomenti').after(nascosti);
chrome.storage.local.get({ nascosti: { giorno: oggi, n: 0 } }, ({ nascosti: c }) => {
  const n = c.giorno === oggi ? c.n : 0;
  nascosti.textContent = n === 0 ? 'Oggi non ho ancora nascosto niente' : n === 1 ? 'Oggi ho nascosto 1 post' : `Oggi ho nascosto ${n} post`;
});

function mostra(imp) {
  attiva.checked = imp.attiva;
  storie.checked = imp.anche_storie;
  for (const chiave of Object.keys(ARGOMENTI)) document.getElementById('nascondi_' + chiave).checked = imp['nascondi_' + chiave];
  stato.textContent = imp.attiva ? 'I video aspettano il tuo clic' : 'Spenta: Instagram fa come vuole';
  document.body.classList.toggle('spenta', !imp.attiva);
}

chrome.storage.sync.get(PREDEFINITE, mostra);
attiva.addEventListener('change', () => salva({ attiva: attiva.checked }));
storie.addEventListener('change', () => salva({ anche_storie: storie.checked }));

function salva(pezzo) {
  chrome.storage.sync.set(pezzo, () => chrome.storage.sync.get(PREDEFINITE, mostra));
}
