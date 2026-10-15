// giudice.js — decide se un post parla di un argomento spento, confrontando quello che dice di sé con le
// parole di argomenti.js. Lo usano setaccio.js (dentro la pagina) e filtro.js (nel mondo dell'estensione):
// sono due mondi che non si vedono, per questo il giudice sta in un file suo e si carica in tutti e due.
globalThis.CPG_GIUDICE = (ARGOMENTI) => {
  // Tutto minuscolo e senza accenti, ogni segno diventa uno spazio: «#ForzaNapoli!» → « forzanapoli ».
  // Si cerca « parola », con gli spazi attorno, così «gol» non scatta dentro «golf» né «inter» dentro «internet».
  const riduci = (s) => ' ' + s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  const prepara = (lista) => (lista || []).map((p) => (/[a-z0-9]/i.test(p) ? { p: riduci(p), emoji: false } : { p, emoji: true }));
  const DIZIONARI = Object.fromEntries(Object.entries(ARGOMENTI).map(([chiave, a]) => [chiave, {
    forti: prepara(a.forti), ambigui: prepara(a.ambigui), contesto: prepara(a.contesto),
    eccezioni: (a.eccezioni || []).map(riduci), account: new Set(a.account || []), nomi: a.account_contiene || [],
  }]));
  const trova = (voci, testo, grezzo) => voci.filter(({ p, emoji }) => (emoji ? grezzo : testo).includes(p)).map(({ p }) => p.trim());

  // Basta un account del giro (o un nome utente che lo dice: «…calcio…», «…football…») · o una parola forte ·
  // o due parole di contesto diverse · o una di contesto insieme a un nome ambiguo («gol» + «Napoli»).
  // I nomi ambigui da soli non bastano mai.
  function giudica(grezzo, autori, impostazioni) {
    const testo = riduci(grezzo);
    for (const [chiave, d] of Object.entries(DIZIONARI)) {
      if (!impostazioni['nascondi_' + chiave]) continue;
      const account = autori.filter((a) => d.account.has(a) || d.nomi.some((n) => a.includes(n)));
      if (account.length) return { chiave, perche: account.map((a) => '@' + a) };
      let t = testo;
      for (const e of d.eccezioni) t = t.split(e).join(' ');
      const forti = trova(d.forti, t, grezzo);
      if (forti.length) return { chiave, perche: forti };
      const contesto = trova(d.contesto, t, grezzo);
      const ambigui = trova(d.ambigui, t, grezzo);
      if (contesto.length >= 2 || (contesto.length && ambigui.length)) return { chiave, perche: [...contesto, ...ambigui] };
    }
    return null;
  }

  return { giudica };
};
