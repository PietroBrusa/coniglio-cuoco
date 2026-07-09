# Testing

Questo progetto adotta la **piramide dei test** descritta nel documento teorico
`07_theory_testing`: molti test unitari (veloci e isolati), alcuni test di
integrazione, pochi test end-to-end (lenti ma ad altissima confidenza).

```
        ▲  meno numerosi, più lenti, più realistici
        │        ┌───────────────────────────┐
   E2E  │        │ frontend: flusso utente    │  Vitest browser + Playwright
        │        │ backend:  stack + Mongo    │  Supertest + Testcontainers
        │      ┌─┴───────────────────────────┴─┐
 Integr.│      │ backend: HTTP reali in-process │  NestJS + Supertest
        │    ┌─┴───────────────────────────────┴─┐
  Unit  │    │ logica pura FE + servizi/guard BE  │  Vitest / Jest
        │    └────────────────────────────────────┘
        ▼  più numerosi, più veloci, più isolati
```

## Strumenti (come da teoria)

| Livello              | Frontend                              | Backend                          |
| -------------------- | ------------------------------------- | -------------------------------- |
| Unit                 | Vitest (ambiente Node)                | Jest + `@nestjs/testing`         |
| Component            | Vitest **browser mode** + Playwright  | —                                |
| Integration          | —                                     | Supertest (HTTP in-process)      |
| End-to-End           | Vitest browser (app reale)            | Supertest + **Testcontainers**   |

I test double usati (dal capitolo "Fakes and Test Doubles"): **stub** e **mock**
(`jest.fn` / `vi.fn`) per i servizi e i repository, **fake** in-memory per
`localStorage`, e nessun mock nell'E2E (dipendenze tutte reali).

---

## Backend (`backend/`)

Test unitari/integrazione accanto al codice come `*.spec.ts`; E2E in
`test/*.e2e-spec.ts`.

```bash
cd backend
npm test          # unit + integration (Jest)
npm run test:cov  # + coverage
npm run test:e2e  # E2E con MongoDB reale (richiede Docker in esecuzione)
```

- **Unit** — `AuthService`, `SessionsService`, `ChildrenService`, `AuthGuard`,
  `SessionsController`: le dipendenze (repository TypeORM, `JwtService`,
  `ChildrenService`) sono sostituite da mock, così la logica è testata in
  isolamento (registrazione/login, hashing bcrypt, regole di *ownership* delle
  sessioni, verifica del token). Inclusa la **validazione dei DTO**
  (`class-validator`) su `AuthCredentialsDto` e `CreateSessionDto` (lunghezze,
  enum, struttura annidata level→metrics→touches).
- **E2E** (`test/app.e2e-spec.ts`) — avvia l'**intera** app NestJS e un
  **MongoDB reale** in un container effimero (Testcontainers), poi la interroga
  via HTTP con Supertest: register → login → CRUD sessioni protette da JWT,
  incluse validazione (400) e ownership cross-child (404). Niente è mockato.

> **Nota Testcontainers:** Mongo viene avviato come replica-set a nodo singolo,
> che annuncia l'hostname interno del container. Per connettersi dall'host si usa
> `?directConnection=true` nella connection string (vedi `beforeAll`).

## Frontend (`frontend/`)

Tre progetti Vitest (`vitest.config.ts`), uno per livello della piramide:

```bash
cd frontend
npm test              # tutti i progetti
npm run test:unit     # solo unit (Node)
npm run test:browser  # solo component test (Chromium headless)
npm run test:e2e      # solo E2E (Chromium headless)
```

Convenzioni sui nomi file:

- `*.test.ts(x)` → **unit** (Node): `computeMetrics`, `computeStars`,
  `getFood/getLevel`, `settings` (con fake di `localStorage`), `exportSession`
  (CSV + formattazione metriche), `sessionRecord` (costruzione immutabile del
  record), `tokenStore`, integrità dati `foods`, più un esempio di **module
  mocking** (`vi.mock`) in `levels.mock.test.ts`.
- `*.browser.test.tsx` → **component** (browser reale): `Rabbit`, `RewardScreen`,
  `SetupScreen`, `LevelPlay` (fasi intro→play, completamento livello), `Dashboard`
  (stati loading/vuoto/errore + delete), l'hook clinico `useTouchTracker` (eventi
  pointer/tastiera → tocchi), gli hook React Query (`useSessions`,
  `useSaveSession`), `AuthContext` (login/register/logout + mappatura errori) e il
  layer `client.ts` (gestione 401). La rete è isolata con `vi.spyOn` sulle
  istanze API generate. Via `vitest-browser-react`.
- `e2e/*.e2e.test.tsx` → **E2E**: monta l'app reale (router, guard, provider,
  schermate) e percorre flussi utente completi — le **Impostazioni** e l'intero
  **percorso di gioco** (setup → 3 livelli giocati con Makey-Makey → riepilogo) —
  con autenticazione seminata programmaticamente.

> **Nota browser mode (Vite 8 + Vitest 4):** l'hoisting di `vi.mock` non è
> supportato in modalità browser con questa combinazione di versioni, quindi il
> module mocking è dimostrato nei test **unit** (Node), mentre i component test
> usano i componenti reali e isolano gli effetti collaterali (es. audio
> disabilitato via `localStorage`).

---

## Riepilogo

| Suite                    | File                                   | Test |
| ------------------------ | -------------------------------------- | ---- |
| Backend unit/integration | `backend/src/**/*.spec.ts`             | 37   |
| Backend E2E              | `backend/test/app.e2e-spec.ts`         | 11   |
| Frontend unit            | `frontend/src/**/*.test.ts(x)`         | 45   |
| Frontend component       | `frontend/src/**/*.browser.test.tsx`   | 44   |
| Frontend E2E             | `frontend/e2e/*.e2e.test.tsx`          | 5    |

**Totale: 142 test.** L'E2E backend richiede Docker in esecuzione; i test
browser/E2E frontend richiedono il browser Chromium di Playwright
(`npx playwright install chromium`).

## Coverage e CI

- **Coverage**: `npm run test:cov` in `backend/` (Jest) e in `frontend/`
  (Vitest, provider `v8`) — report `text` + `html`.
- **CI**: `.github/workflows/tests.yml` esegue l'intera piramide (backend
  unit + E2E con Testcontainers, frontend unit + component + E2E) a ogni push /
  pull request. Docker e il browser Chromium sono disponibili sui runner
  `ubuntu-latest`.
