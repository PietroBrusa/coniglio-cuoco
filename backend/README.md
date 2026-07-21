# Backend — Coniglio Cuoco 🐰💾

API NestJS per la **persistenza delle sessioni di gioco** su **MongoDB**
(NoSQL), tramite TypeORM. Stack scelto seguendo il materiale del corso
(doc 04-05: NestJS + TypeORM + MongoDB, REST validato, ValidationPipe, CORS).

## Perché MongoDB

Una sessione è un documento JSON annidato (sessione → livelli → tocchi):
schema flessibile, supporto nativo ai dati gerarchici, nessuna migrazione di
schema. È la stessa motivazione del doc 05 ("Why MongoDB for SPAs").

## Requisiti

- Node.js
- Un'istanza MongoDB raggiungibile. Tre opzioni:
  - **Docker** (consigliato): `docker run -d --name coniglio-mongo -p 27017:27017 mongo:7`
  - **MongoDB locale** installato come servizio
  - **MongoDB Atlas** (cloud): usa la connection string `mongodb+srv://...`

## Configurazione

Copia `.env.example` in `.env` e adatta i valori:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=coniglio_cuoco
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=            # obbligatoria: senza, l'avvio fallisce
JWT_EXPIRES=12h
```

`JWT_SECRET` **non ha un valore di ripiego**, di proposito: un segreto di default farebbe
partire l'applicazione con token falsificabili da chiunque legga il sorgente. Generane uno
casuale (diverso per ogni ambiente) con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Avvio

```bash
npm install
npm run start:dev    # sviluppo con watch
npm run build        # compila in dist/
npm run start:prod   # esegue la build
```

All'avvio: `🐰 Rabbit Cook API listening on http://localhost:3000`

## Documentazione OpenAPI / Swagger

L'API è documentata con **Swagger** (`@nestjs/swagger`, plugin CLI abilitato in
`nest-cli.json`):

- **Swagger UI**: http://localhost:3000/api
- **Spec OpenAPI (JSON)**: http://localhost:3000/api-json

Lo spec viene usato dal frontend per **generare il client tipizzato** (vedi
`frontend/README.md`, script `npm run gen:api`). Le risposte sono tipizzate da
DTO dedicate (`AuthResponseDto`, `SessionDto`, `DeleteResultDto`).

## API REST

Le rotte `/sessions` sono **protette da JWT** (`AuthGuard`) e scopate sul
bambino autenticato: il `childId` è imposto dal token, non dal client.

| Metodo | Path              | Auth | Descrizione                              |
|--------|-------------------|------|------------------------------------------|
| POST   | `/auth/register`  | —    | Registra un bambino → restituisce token  |
| POST   | `/auth/login`     | —    | Autentica → restituisce token            |
| POST   | `/sessions`       | JWT  | Crea una sessione per il bambino loggato |
| GET    | `/sessions`       | JWT  | Elenca le sue sessioni (più recenti prima) |
| GET    | `/sessions/:id`   | JWT  | Dettaglio (solo se propria)              |
| DELETE | `/sessions/:id`   | JWT  | Elimina (solo se propria)                |

Il body atteso da `POST /sessions` è lo stesso oggetto `Session` prodotto dal
frontend (`src/types.ts`). La `ValidationPipe` globale rifiuta payload non
conformi con `400 Bad Request`.

## Struttura

```
src/
  main.ts                         Bootstrap: CORS + ValidationPipe globale
  app.module.ts                   Connessione MongoDB (TypeORM, async da env)
  auth/
    auth.module.ts                Feature module (JWT)
    auth.controller.ts            Rotte POST /auth/register | /auth/login
    auth.service.ts               Registrazione/login, hash bcrypt, firma token
    auth.guard.ts                 Guard che valida il Bearer token
    dto/auth-credentials.dto.ts   DTO credenziali validate
    dto/auth-response.dto.ts      DTO risposta (access_token + name)
  children/
    children.module.ts            Feature module
    children.service.ts           Accesso agli account bambino
    entities/child.entity.ts      Entità account (nome univoco + hash)
  sessions/
    sessions.module.ts            Feature module
    sessions.controller.ts        Rotte REST /sessions (protette)
    sessions.service.ts           Logica + MongoRepository
    dto/create-session.dto.ts     DTO validati (class-validator)
    dto/session.dto.ts            DTO di risposta (SessionDto, DeleteResultDto)
    entities/session.entity.ts    Entità TypeORM + sotto-documenti
```

## Test rapido (con MongoDB attivo)

Le rotte sessioni richiedono un token: prima ci si registra/logga, poi si usa
il token come `Bearer`.

```bash
# 1) Registrazione (o login) -> copia "access_token" dalla risposta
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"B001","password":"segreta"}'

# 2) Usa il token (sostituisci <TOKEN>)
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"sessionNumber":1,"food":"Carota","date":"2026-06-18T10:00:00.000Z","levels":[]}'

curl http://localhost:3000/sessions -H "Authorization: Bearer <TOKEN>"
```
