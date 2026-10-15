// argomenti.js — gli argomenti che si possono far sparire dal feed, e le parole che li riconoscono.
// Lo leggono filtro.js (per decidere) e il pannello (che disegna un interruttore per ogni argomento):
// per aggiungere un argomento basta una voce qui sotto.
//
// Le parole si scrivono minuscole e senza accenti, come le riduce filtro.js. Quattro cassetti:
//   forti    — bastano da sole (nomi che vogliono dire solo quello: «juventus», «fuorigioco», #seriea)
//   ambigui  — nomi che sono anche città o parole comuni («napoli», «roma», «messi», «allegri»):
//              da soli non bastano, se no sparirebbe ogni post con la posizione «Roma, Lazio, Italia»
//   contesto — parole del mestiere che da sole dicono poco («gol», «partita», «stadio»):
//              ne servono due diverse, o una insieme a un nome ambiguo
//   account  — chi pubblica: un post di @433 è calcio anche se la didascalia è solo un'emoji
//   account_contiene — pezzi di nome utente che bastano da soli (@calcio_mercato_live, @footballdaily…)
globalThis.CPG_ARGOMENTI = {
  calcio: {
    nome: 'Calcio',
    descrizione: 'Partite, gol, squadre e giocatori spariscono dal feed e dai reel',
    predefinito: true,
    forti: [
      '⚽',
      // il gioco
      'calciatore', 'calciatori', 'calciatrice', 'calciatrici', 'calciomercato', 'fantacalcio', 'fuorigioco',
      'album panini', 'figurine panini', 'calcio di rigore', 'calcio d angolo', 'calcio di punizione', 'golazo', 'golazzo', 'scudetto', 'pallone d oro',
      'ballon d or', 'ballondor', 'football', 'footballer', 'footballers', 'soccer', 'futbol', 'futebol',
      'footballskills', 'footballedits', 'footballedit', 'soccerskills', 'calcioitaliano',
      // i campionati
      'seriea', 'serieatim', 'serieb', 'champions league', 'championsleague', 'ucl', 'europa league', 'europaleague',
      'conference league', 'premier league', 'premierleague', 'la liga', 'laliga', 'bundesliga', 'ligue 1', 'eredivisie',
      'uefa', 'fifa', 'coppa italia', 'coppaitalia', 'euro 2028', 'mondiali 2030',
      // le squadre che non sono anche città
      'juventus', 'juve', 'juventino', 'juventini', 'interista', 'interisti', 'milanista', 'milanisti', 'romanista',
      'romanisti', 'laziale', 'laziali', 'acmilan', 'ac milan', 'inter milan', 'fc inter', 'atalanta', 'sampdoria',
      'udinese', 'sassuolo', 'salernitana', 'cremonese', 'forzanapoli', 'forzajuve', 'forzainter', 'forzaroma',
      'forzamilan', 'forzalazio', 'forzaviola', 'finoallafine', 'sempreinter', 'real madrid', 'realmadrid',
      'fc barcelona', 'fcbarcelona', 'atletico madrid', 'psg', 'paris saint germain', 'manchester united',
      'manchester city', 'man utd', 'man city', 'fc bayern', 'bayern monaco', 'bayern munich', 'bayern munchen', 'borussia', 'benfica', 'galatasaray',
      'fenerbahce', 'boca juniors', 'river plate', 'al nassr', 'inter miami',
      // giocatori e allenatori
      'leo messi', 'lionel messi', 'ronaldo', 'cristiano ronaldo', 'cr7', 'mbappe', 'haaland', 'neymar', 'lewandowski', 'lamine yamal',
      'yamal', 'vinicius', 'bellingham', 'salah', 'de bruyne', 'modric', 'harry kane', 'lautaro', 'vlahovic', 'leao',
      'osimhen', 'kvaratskhelia', 'kvara', 'de gea', 'kean', 'retegui', 'commisso', 'palladino', 'dybala', 'federico chiesa', 'nicolo barella', 'donnarumma', 'buffon',
      'totti', 'del piero', 'delpiero', 'maldini', 'pirlo', 'baggio', 'ibrahimovic', 'zlatan', 'maradona', 'pele',
      'zidane', 'ronaldinho', 'lukaku', 'pogba', 'griezmann', 'benzema', 'kroos', 'ancelotti', 'mourinho', 'guardiola',
      'klopp', 'spalletti', 'max allegri', 'massimiliano allegri', 'inzaghi', 'antonio conte', 'gasperini', 'de laurentiis',
    ],
    ambigui: [
      // giocatori e allenatori il cui cognome è anche una parola («li abbiamo messi», «siamo allegri»)
      'messi', 'allegri',
      // squadre che sono anche città
      'napoli', 'roma', 'lazio', 'milan', 'inter', 'torino', 'bologna', 'fiorentina', 'genoa', 'verona', 'cagliari',
      'lecce', 'empoli', 'monza', 'parma', 'como', 'venezia', 'palermo', 'bari', 'spezia', 'frosinone', 'barca',
      'barcellona', 'barcelona', 'chelsea', 'arsenal', 'liverpool', 'tottenham', 'dortmund', 'ajax', 'porto', 'sporting',
      'azzurri', 'nazionale',
    ],
    contesto: [
      'calcio', 'gol', 'goal', 'partita', 'partite', 'match', 'stadio', 'curva sud', 'curva nord', 'ultras',
      'tifosi', 'tifoso', 'tifosa', 'derby', 'rigore', 'rigori', 'allenatore', 'campionato', 'trasferta',
      'attaccante', 'centrocampista', 'difensore', 'portiere', 'dribbling', 'serie a', 'serie b',
      'champions', 'mondiali', 'world cup', 'supercoppa', 'var', 'arbitro', 'cartellino', 'goalkeeper', 'striker',
      'midfielder', 'kick off', '🏟', '🥅',
    ],
    account: [
      '433', 'brfootball', 'goal', 'goalitalia', 'espnfc', 'onefootball', 'footballitalia', 'fabrizioromano',
      'seriea', 'championsleague', 'europaleague', 'premierleague', 'laliga', 'bundesliga', 'fifaworldcup', 'uefa',
      'juventus', 'inter', 'acmilan', 'sscnapoli', 'officialasroma', 'officialsslazio', 'acffiorentina', 'atalantabc',
      'bolognafc1909', 'torinofc1906', 'realmadrid', 'fcbarcelona', 'psg', 'manchesterunited', 'mancity',
      'liverpoolfc', 'chelseafc', 'arsenal', 'fcbayern', 'bvb09', 'leomessi', 'cristiano', 'k.mbappe', 'erling',
      'gazzettadellosport', 'corrieredellosport', 'tuttosport', 'skysport', 'dazn_it', 'sportmediaset',
      'cronachedispogliatoio', 'calciatoribrutti', 'fantacalcio', 'transfermarkt', 'sportitalia', 'footballdaily',
      '90min_football', 'sporf', 'troll.football', 'footballtransfers', 'vivoazzurro', 'azzurri',
      'viola_news', 'violanews', 'firenzeviola', 'fiorentinauno', 'tuttomercatoweb', 'calciomercato.com', 'tmwmagazine',
      'juventibus', 'milannews.it', 'fcinter1908', 'areanapoli.it', 'forzaroma.info', 'lalaziosiamonoi',
    ],
    account_contiene: ['calcio', 'football', 'futbol', 'soccer', 'ultras', 'pallone'],
    // frasi che contengono una parola del cassetto ma parlano d'altro: si tolgono dal testo prima di cercare
    eccezioni: ['partita iva', 'partite iva', 'ricco di calcio', 'ricca di calcio', 'calcio e magnesio', 'calcio e vitamina'],
  },
};
