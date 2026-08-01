# La Fattoria del Coniglio Cuoco 🐰🥕

Gioco terapeutico per l'avvicinamento all'alimento in bambini con selettività
alimentare, pensato per l'uso con un controller **Makey-Makey** (toccare il
cibo reale genera un input da tastiera/click). Forte enfasi sulla
**misurazione dei comportamenti di tocco** per la documentazione clinica.

Frontend SPA in **React + TypeScript + Vite**. Le sessioni vengono salvate in
modo persistente su un backend MongoDB (vedi `../backend`).

## Stack e best practice applicate

Seguendo il materiale del corso *Advanced Web Design*:

- **TypeScript** con props e dati di dominio tipizzati (`src/types.ts`).
- **React Router** per la navigazione: ogni schermata è una route
  (`src/routes/`), con route protette da autenticazione (`ProtectedRoute`).
- **Context API** per lo stato condiviso: `AuthContext` (sessione/token) e
  `GameContext` (flusso di gioco) in `src/context/`.
- **SCSS Modules** scoped (`.module.scss`) co-locati col componente; nesting e un
  partial di token (`src/styles/_tokens.scss`). La palette tematica resta in CSS
  custom properties globali in `src/index.css`.
- **React Query** per fetch/salvataggio/eliminazione sul backend (`src/api/`).
- **Client API generato da OpenAPI** (`src/api/generated/`, axios) a partire
  dallo spec Swagger del backend; rigenerabile con `npm run gen:api`.
- **Auth JWT lato client**: login/registrazione via client generato, token in
  `localStorage` (`src/auth/tokenStore.ts`), header `Authorization: Bearer`
  iniettato automaticamente (`src/api/apiClient.ts`).
- Variabili d'ambiente con prefisso `VITE_` (`.env`, non committato).
- Flusso dichiarativo, one-way data flow, `key` nelle liste, valori derivati,
  effetti solo per sincronizzare con sistemi esterni (eventi Makey-Makey).

### Rigenerare il client API

```bash
# con il backend attivo (espone lo spec su /api-json):
curl http://localhost:3000/api-json -o openapi.json
npm run gen:api        # genera src/api/generated/ (typescript-axios)
```

## Avvio

```bash
npm install
cp .env.example .env   # poi adatta VITE_API_URL se serve
npm run dev            # sviluppo (http://localhost:5173)
npm run typecheck      # controllo dei tipi
npm run lint
npm run build          # build di produzione (tsc + vite)
```

> Per la persistenza serve il backend attivo (`../backend`) e MongoDB.
> Senza backend il gioco funziona comunque, ma la seduta non si salva: il
> riepilogo mostra un errore con possibilità di riprova, e chiudendo la pagina
> i dati si perdono.

## Come si gioca

1. **Accesso bambino** — codice del bambino e password: si accede a un account
   esistente o se ne registra uno nuovo. Tutto il resto — gioco e sessioni
   salvate — è ristretto a quel bambino, e l'isolamento è imposto dal backend
   leggendo l'identità dal token, non dalla richiesta.
2. **Setup** — numero sessione, alimento da testare e **difficoltà** (l'ID
   bambino è quello loggato; "cambia bambino" per tornare all'accesso).
   - **🌱 Facile** — meccanica base: tocchi liberi.
   - **🎵 Difficile** — meccanica *piano tiles*: l'alimento si "accende" a
     ritmo e valgono solo i tocchi eseguiti **quando è illuminato**; i tocchi
     fuori tempo sono un *miss* (nessun progresso). Le metriche cliniche
     registrano comunque **tutti** i tocchi reali.
3. **Livelli** (storia del Coniglio cuoco). Tutti e tre usano la meccanica
   *hold* con la stessa finestra di misura di 6 secondi, così le tre linee del
   grafico sono percentuali dello stesso denominatore e si leggono fra loro:
   - **L1 · La Raccolta** — contatto con le dita.
   - **L2 · L'Annusata** — contatto prolungato col naso (guanto isolante).
   - **L3 · L'Assaggio** — contatto con labbra/lingua.
   - Ogni livello inizia toccando l'alimento alcune volte (avvio rapido). La
     finestra di misura si apre al **primo contatto**, non a inizio livello.
4. **Ricompensa** — stelle, espressioni del coniglio e riepilogo metriche.
   Le stelle (1–3) sono assegnate in `RewardScreen.tsx`: 1 garantita per aver
   completato, +1 per l'approccio pronto (latenza al 1° tocco ≤ 3 s), +1 per il
   coinvolgimento sostenuto (livelli *hold*: Engagement Ratio ≥ 40%; livelli a
   tocchi e modalità difficile: contatto totale ≥ 1,5 s). Soglie in cima al
   file, facili da tarare.
5. **Fine sessione** — riepilogo completo e **salvataggio automatico su DB**
   (una volta sola: tornare indietro col browser non duplica la seduta).

Dalla schermata di accesso/setup è raggiungibile la **dashboard** ("Sessioni
salvate"), che presenta **un programma per alimento**: per l'alimento scelto
mostra il **grafico di andamento ABA** (percentuale di contatto per seduta, una
linea per livello, con linea di criterio e linee di cambio fase), l'elenco delle
sedute con il dettaglio delle metriche e la **griglia a intervalli** di ciascun
livello, e la **cancellazione** dal database.

Dalla dashboard si **esportano le schede ABA in Excel** (`⬇ Esporta Excel`): un
file per bambino, con **un foglio per alimento** — intestazione della scheda
cartacea, una riga per seduta e il **grafico nativo di Excel** (una serie per
livello, linea di criterio e linee verticali ai cambi di condizione). Il file si
genera nel browser dai dati già caricati, quindi non passa dal backend. Resta
comunque una copia che invecchia: la fonte allineata al database è la dashboard.

Senza hardware si può giocare con il **mouse/touch** sull'alimento oppure con la
**barra spaziatrice** — l'unico tasto accettato, perché il Makey-Makey è
cablato su un solo sensore e restringere il tasto evita falsi positivi da una
tastiera vicina alla postazione.

## Metriche registrate (per livello)

Implementate in `src/hooks/useTouchTracker.ts` secondo il documento di progetto:

| Simbolo | Significato |
|---|---|
| `l`   | Latenza al primo tocco (comparsa → primo contatto) |
| `n`   | Numero totale di tocchi |
| `t_c` | Contatto totale (Σ durate dei tocchi) |
| `t_m` | Durata media del tocco (`t_c / n`) |
| `irt` | Inter-Response Time medio (rilascio → tocco successivo) |
| `er`  | Engagement Ratio % (`t_c / T_totale · 100`) |

## Struttura del codice

Ogni componente ha il suo **SCSS Module co-locato** (es. `LevelPlay.module.scss`
accanto a `LevelPlay.tsx`); le primitive di design condivise (layout, bottoni,
griglia metriche…) stanno in `styles/shared.module.scss`, e i colori di servizio
ripetuti nel partial `styles/_tokens.scss`.

```
src/
  types.ts                  Tipi condivisi del dominio
  context/
    AuthContext.tsx         Stato sessione/token + login/registrazione/logout
    GameContext.tsx         Stato del flusso di gioco (sessione, livello, esito)
  routes/
    ProtectedRoute.tsx      Guardia: accesso solo se autenticati
    LoginRoute / SetupRoute / PlayRoute / RewardRoute /
    SummaryRoute / DashboardRoute.tsx   Una route per schermata
  auth/tokenStore.ts        Token + bambino in localStorage (non-React)
  game/                     Logica di dominio pura (niente React)
    foods.ts                Catalogo degli alimenti selezionabili
    levels.ts               Storia e parametri dei livelli
    hardBeat.ts             Regole temporali della modalità difficile
    stars.ts                Assegnazione delle stelle
    sessionRecord.ts        Costruzione del record di sessione (dominio)
    settings.ts             Soglie del terapista (localStorage)
  hooks/
    useTouchTracker.ts      Motore di misurazione tocchi (Makey-Makey / pointer)
    useSaveSession.ts       Mutation salvataggio (+ invalidate), una volta sola
    useSessions.ts          Query elenco + mutation elimina
  utils/
    computeMetrics.ts       Matematica delle metriche (funzione pura)
    abaData.ts              Derivazione delle viste cliniche (funzioni pure)
    formatMetrics.ts        Metriche grezze → etichette e unità per la UI
    abaWorkbook.ts          Sedute → schede ABA (un foglio per alimento + grafico)
    downloadFile.ts         Consegna dei byte al browser come download
    sound.ts                Jingle di vittoria (Web Audio API, nessun asset)
    xlsx/                   Scrittura di un .xlsx a mano (OOXML + fflate)
      xml.ts                Escaping e dichiarazione XML
      sheet.ts              Fogli, riferimenti di cella e stili
      chart.ts              Grafico a dispersione DrawingML (nessuna libreria lo fa)
      package.ts            Parti, relazioni e zip del pacchetto
  api/
    generated/              Client API generato da OpenAPI (axios) — non editare
    apiClient.ts            Configurazione + istanze authApi/sessionsApi
    client.ts               Adattatori sessioni (su client generato) + gestione 401
  screens/
    LoginScreen.tsx         Accesso/registrazione (usa AuthContext)
    SetupScreen.tsx (+scss) Dati sessione, alimento e difficoltà
    LevelPlay.tsx   (+scss) Intro narrativa + gioco misurato (facile/difficile)
    RewardScreen.tsx(+scss) Stelle + riepilogo metriche del livello
    SessionSummary.tsx(+scss) Riepilogo e salvataggio automatico su DB
    Dashboard.tsx   (+scss) Un programma per alimento: grafico, sedute, elimina
    SettingsScreen.tsx(+scss) Soglie delle stelle e suono
  shared/
    Rabbit.tsx      (+scss) Avatar del coniglio (espressioni)
    AbaChart.tsx    (+scss) Grafico di andamento ABA (SVG scritto a mano)
    IntervalGrid.tsx(+scss) Griglia di whole-interval recording
    seriesColors.ts         Colori delle serie, uno per livello
  styles/
    _tokens.scss            Token colore di servizio (partial @use)
    shared.module.scss      Primitive di design condivise (SCSS Modules)
  App.tsx                   Definizione delle route
  main.tsx                  Entry point: provider (Query, Router, Auth, Game)
```
