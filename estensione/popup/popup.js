const PREDEFINITE = { attiva: true, anche_storie: false };
const attiva = document.getElementById('attiva');
const storie = document.getElementById('anche_storie');
const stato = document.getElementById('stato');

function mostra(imp) {
  attiva.checked = imp.attiva;
  storie.checked = imp.anche_storie;
  stato.textContent = imp.attiva ? 'I video aspettano il tuo clic' : 'Spenta: Instagram fa come vuole';
  document.body.classList.toggle('spenta', !imp.attiva);
}

chrome.storage.sync.get(PREDEFINITE, mostra);
attiva.addEventListener('change', () => salva({ attiva: attiva.checked }));
storie.addEventListener('change', () => salva({ anche_storie: storie.checked }));

function salva(pezzo) {
  chrome.storage.sync.set(pezzo, () => chrome.storage.sync.get(PREDEFINITE, mostra));
}
