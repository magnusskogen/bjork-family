# Familien Bjørk

En liten webapp for to ting: hva Olea og Louis skal ha med til mat hver dag, og
beskjeder fra skole, ungdomsskole og barnehage.

Next.js (App Router) · TypeScript · Prisma mot Neon · Tailwind · Vercel.
All skriving går gjennom server actions — ingen egne API-routes.

## Ukeregelen

Dette er den viktigste logikken i appen, og den bor ett sted:
[`src/lib/week.ts`](src/lib/week.ts).

> Inneværende uke kan alltid redigeres. Fra lørdag kl. 00:00 åpnes også neste uke.

`editableRange(now)` gir mandag i inneværende uke, og søndag i inneværende uke —
eller søndag i neste uke dersom `now` er lørdag eller søndag. Tidssonen er alltid
`Europe/Oslo`, og uka starter på mandag.

Funksjonen brukes to steder:

1. **I grensesnittet**, for å vise dager utenfor rekkevidde som read-only.
2. **I hver eneste server action** (`src/app/actions.ts`), som en hard validering
   via `assertEditable()`. Datoen sjekkes mot serverens klokke. Klientens klokke
   og tidssone brukes ingen steder.

Enhetstestene i [`src/lib/week.test.ts`](src/lib/week.test.ts) kjører med
`TZ=America/Los_Angeles` nettopp for å bevise at svaret ikke avhenger av hvor
koden kjører. De dekker fredag, lørdag, søndag, mandag, midnattsovergangen
lørdag kl. 00:00, årsskiftet 2026/2027 og sommertidsovergangen.

```bash
npm test
```

## Kom i gang lokalt

### 1. Lag en database på Neon

1. Opprett et prosjekt på [neon.tech](https://neon.tech) (velg en region i
   Europa, f.eks. `eu-central-1`).
2. Under **Connection Details** trenger du to strenger:
   - **Pooled connection** (vertsnavnet inneholder `-pooler`) → `DATABASE_URL`
   - **Direct connection** (uten `-pooler`) → `DIRECT_URL`

   Prisma kjører vanlige spørringer gjennom pooleren, men migrasjoner må gå
   direkte.

### 2. Miljøvariabler

Kopier `.env.example` til `.env.local` og fyll inn:

| Variabel       | Hva det er                                                        |
| -------------- | ----------------------------------------------------------------- |
| `DATABASE_URL` | Neon, pooled connection. Brukes av appen.                         |
| `DIRECT_URL`   | Neon, direct connection. Brukes bare av `prisma migrate`.         |
| `FAMILY_PIN`   | Den delte koden familien logger inn med.                          |
| `AUTH_SECRET`  | Tilfeldig streng, minst 16 tegn. Signerer innloggingscookien.     |

```bash
cp .env.example .env.local
openssl rand -base64 32   # bruk denne som AUTH_SECRET
```

Hold deg til **én** env-fil. `next dev` leser `.env.local` av seg selv, men
`prisma` og `tsx` gjør det ikke — derfor går alle `db:`-skriptene gjennom
`dotenv -e .env.local`. Har du også en `.env` liggende, er det to steder å holde
i sync, og `.env.local` vinner.

### 3. Installer, migrer, seed

```bash
npm install
npm run db:deploy   # oppretter tabellene
npm run db:seed     # legger inn Magnus, Julie, Olea, Louis og Fiona
npm run dev
```

Appen kjører på <http://localhost:3000>. Første skjerm spør om familiekoden,
neste spør hvem du er.

## Skript

| Kommando             | Hva det gjør                                       |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Utviklingsserver                                   |
| `npm run build`      | `prisma generate` + produksjonsbygg                |
| `npm test`           | Enhetstester for ukelogikken                       |
| `npm run db:migrate` | Ny migrasjon under utvikling (`prisma migrate dev`) |
| `npm run db:deploy`  | Kjør migrasjoner (`prisma migrate deploy`)         |
| `npm run db:seed`    | Legg inn familiemedlemmene (idempotent)            |
| `npm run db:studio`  | Prisma Studio                                      |

## Deploy på Vercel

1. Push repoet til GitHub og importer det i Vercel.
2. Legg inn de fire miljøvariablene under **Settings → Environment Variables**,
   for både Production og Preview.
3. Bygget kjører `prisma generate` automatisk (`postinstall` og `build`).
4. Migrasjoner kjøres ikke av bygget. Kjør dem selv når schemaet endres:

   ```bash
   DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
   ```

   Vil du at Vercel skal gjøre det, sett build-kommandoen til
   `prisma migrate deploy && next build`.

5. Seed kjøres én gang, mot produksjonsdatabasen:

   ```bash
   DATABASE_URL=... npm run db:seed
   ```

## Innlogging

Fem personer i samme hus, ingen sensitive data — så det er holdt enkelt.

- Én delt PIN fra `FAMILY_PIN`. Riktig kode gir en signert `httpOnly`-cookie
  (HMAC-SHA256 med `AUTH_SECRET`) som varer i et år.
- `src/proxy.ts` sender alle uten gyldig cookie til `/login`. Dette het
  `middleware.ts` før Next 16 — samme mekanisme, nytt navn.
- Etter innlogging velger du hvem du er. Valget ligger i `localStorage` og
  brukes som `createdById`. Du kan bytte fra knappen øverst til høyre.

Bytter du `AUTH_SECRET`, blir alle logget ut.

## Struktur

```
prisma/
  schema.prisma          datamodell + migrasjoner
  seed.ts                familiemedlemmene
src/
  proxy.ts               sender uinnloggede til /login
  lib/
    week.ts              ukeregelen — brukes av både UI og server actions
    week.test.ts         enhetstester for ukeregelen
    auth.ts              PIN og signert cookie
    family.ts            hvem som har med matpakke
    format.ts            norske datoer og «Julie, i går»
  app/
    actions.ts           alt som skriver til databasen
    page.tsx             uka med matpakker
    beskjeder/           skjema og liste for beskjeder
    login/
  components/
```

## Datamodellen

Alt lagres per dato, ikke per ukenummer. `MealEntry` har en unik nøkkel på
`(childId, date)`, så autolagringen kan gjøre `upsert` uten å lage duplikater.
Tømmer du feltet, slettes raden.

Fiona ligger i `Member` fordi barnehagen sender beskjeder, men hun har ingen
matpakkefelt. Hvem som har med mat står i
[`src/lib/family.ts`](src/lib/family.ts) — det eneste stedet familien er
navngitt i koden.

`PendingNotice` står i schemaet uten UI eller logikk. Den er klargjort for
automatisk uttrekk av beskjeder senere. I denne versjonen legges alt inn
manuelt, og det finnes ingen e-postintegrasjon.
