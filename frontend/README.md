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
> Senza backend il gioco funziona comunque: il salvataggio mostra un errore
> con possibilità di riprova, e l'export CSV/JSON resta disponibile.

## Come si gioca

1. **Accesso bambino** — si sceglie il bambino con cui giocare (dalla lista di
   quelli esistenti o creandone uno nuovo). Tutto il resto — gioco incluso e
   sessioni salvate — è scopato su quel bambino.
2. **Setup** — numero sessione, alimento da testare e **difficoltà** (l'ID
   bambino è quello loggato; "cambia bambino" per tornare all'accesso).
   - **🌱 Facile** — meccanica base: tocchi liberi.
   - **🎵 Difficile** — meccanica *piano tiles*: l'alimento si "accende" a
     ritmo e valgono solo i tocchi eseguiti **quando è illuminato**; i tocchi
     fuori tempo sono un *miss* (nessun progresso). Le metriche cliniche
     registrano comunque **tutti** i tocchi reali.
3. **Livelli** (storia del Coniglio cuoco):
   - **L1 · La Raccolta** — approccio rapido: toccare l'alimento con le dita
     (meccanica *count*, N tocchi).
   - **L2 · L'Annusata** — contatto prolungato col naso (guanto isolante);
     riempe una barra (meccanica *hold*, secondi di contatto).
   - **L3 · L'Assaggio** — contatto con labbra/lingua (meccanica *hold*).
   - Ogni livello inizia toccando l'alimento alcune volte (avvio rapido).
4. **Ricompensa** — stelle, espressioni del coniglio e riepilogo metriche.
   Le stelle (1–3) sono assegnate in `RewardScreen.tsx`: 1 garantita per aver
   completato, +1 per l'approccio pronto (latenza al 1° tocco ≤ 3 s), +1 per il
   coinvolgimento sostenuto (livelli *hold*: Engagement Ratio ≥ 40%; livelli a
   tocchi e modalità difficile: contatto totale ≥ 1,5 s). Soglie in cima al
   file, facili da tarare.
5. **Fine sessione** — riepilogo completo, **salvataggio su DB** ed
   **esportazione CSV/JSON**.

Dalla schermata di accesso/setup è raggiungibile la **dashboard** ("Sessioni
salvate"): elenca le sessioni del bambino, ne mostra il dettaglio metriche,
permette di esportarle (CSV/JSON) e di **eliminarle** dal database.

Senza hardware si può giocare con il **mouse/touch** sull'alimento o con i
tasti di default del Makey-Makey (frecce, spazio, W/A/S/D/F/G).

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
  game/
    levels.ts               Storia, alimenti e parametri dei livelli
    sessionRecord.ts        Costruzione del record di sessione (dominio)
  hooks/useTouchTracker.ts  Motore di misurazione tocchi (Makey-Makey / pointer)
  utils/exportSession.ts    Export CSV/JSON + formattazione metriche per la UI
  api/
    generated/              Client API generato da OpenAPI (axios) — non editare
    apiClient.ts            Configurazione + istanze authApi/sessionsApi
    client.ts               Adattatori sessioni (su client generato) + gestione 401
    useSaveSession.ts       Mutation salvataggio (+ invalidate)
    useSessions.ts          Query elenco + mutation elimina
  components/
    LoginScreen.tsx         Accesso/registrazione (usa AuthContext)
    SetupScreen.tsx (+scss) Dati sessione, alimento e difficoltà
    LevelPlay.tsx   (+scss) Intro narrativa + gioco misurato (facile/difficile)
    RewardScreen.tsx(+scss) Stelle + riepilogo metriche del livello
    SessionSummary.tsx(+scss) Riepilogo, salvataggio su DB ed esportazione
    Dashboard.tsx   (+scss) Sessioni del bambino: dettaglio, export, elimina
    Rabbit.tsx      (+scss) Avatar del coniglio (espressioni)
  styles/
    _tokens.scss            Token colore di servizio (partial @use)
    shared.module.scss      Primitive di design condivise (SCSS Modules)
  App.tsx                   Definizione delle route
  main.tsx                  Entry point: provider (Query, Router, Auth, Game)
```
