# Salon Booking System

Rezervační systém pro kadeřnický salon — case study pro výběrové řízení na pozici AI Application Developer.

**🌐 Live URL:** https://salon-booking-2026-fb245.web.app  
**⚙️ Admin panel:** https://salon-booking-2026-fb245.web.app/admin

---

## Přístupové údaje

| Role | E-mail | Heslo |
|------|--------|-------|
| Majitelka (owner) | owner@salon.cz | admin123 |
| Recepce | recepce@salon.cz | recep123 |

---

## Architektura

Backend je postaven na Firebase ekosystému. Zvolil jsem **Firestore** místo Realtime Database, protože potřebuji strukturované dotazy se složenými podmínkami (staffId + status + časový rozsah) a transakční zápisy — Realtime Database obě věci podporuje hůř. Veškerá business logika rezervací běží v **Cloud Functions (v2)**: klient nikdy nepíše přímo do kolekce `bookings`, pouze volá server-side funkce. To je klíčové pro prevenci race condition při souběžném rezervování — `createBooking` používá Firestore transakci, která atomicky zkontroluje konflikty a zapíše rezervaci. Firebase Hosting zajišťuje HTTPS a CDN pro React SPA bez nutnosti spravovat vlastní server.

Frontend je **React + TypeScript + Vite + Tailwind CSS**. UX klientské části vychází z Alteg.io (de facto standard pro rezervační systémy salónů v regionu) — tříkrokový lineární flow, který minimalizuje kognitivní zátěž klienta. Opakované návštěvy jsou rozpoznány přes localStorage bez nutnosti registrace.

---

## Spuštění lokálně

### Varianta A — docker-compose (doporučeno)

```bash
# 1. Klonovat repozitář
git clone https://github.com/bkozarik/salon-booking-2026
cd salon-booking-2026

# 2. Nastavit environment variables
cp .env.example .env
# Vyplnit FIREBASE_TOKEN (získat přes: firebase login:ci)

cp src/.env.example src/.env
# Vyplnit Firebase config hodnoty

# 3. Spustit
docker-compose up
```

Aplikace poběží na:
- **http://localhost:5173** — klientská část
- **http://localhost:4000** — Firebase Emulator UI

### Varianta B — manuálně

```bash
# Požadavky: Node.js 20+, Java 17+, firebase-tools

# 1. Závislosti
cd functions && npm install && npm run build && cd ..
cd src && npm install && cd ..

# 2. Emulátor
firebase emulators:start --import=./emulator-data

# 3. Seed dat (v novém terminálu)
cd src
npx tsx src/firebase/runSeed.ts
npx tsx src/firebase/createAdminDocs.ts

# 4. Frontend
npm run dev
```

---

## Předpoklady (assumptions)

Zadání bylo záměrně neúplné. Zde jsou rozhodnutí, která jsem udělal sám, a jejich zdůvodnění:

**Kombinované služby vždy u jednoho mistra**  
Alternativa (různé služby u různých mistrů) by exponenciálně zkomplikovala algoritmus slotů. Pokrývá 90 % reálných případů v salónu.

**Cena za délku vlasů není v systému**  
Zadání explicitně říká: *"to ale salon zatím řeší až na místě, do rezervačního systému to nemusí jít."* Respektováno.

**Opakovaná rezervace přes localStorage**  
Bez registrace — klient je rozpoznán na zařízení po dobu 90 dní. Kompromis mezi UX a jednoduchostí. V produkci by bylo vhodné doplnit volitelnou registraci.

**Timezone pevně UTC+2 (Praha)**  
Systém předpokládá středoevropský čas. Pro mezinárodní použití by bylo nutné ošetřit timezone konverzi na úrovni Cloud Functions.

**Zrušení rezervace bez sankce**  
Cancellation policy není v zadání zmíněna — rozhodl jsem ve prospěch jednoduchosti MVP.

**Mistry nelze částečně blokovat v rámci dne**  
Rozvrh podporuje celé dny + výjimky. Half-day blokování by přidalo složitost bez jasného požadavku.

**Role: owner a receptionist**  
Owner vidí analytiku a spravuje kadeřníky/služby. Receptionist vidí kalendář a rezervace. Minimální set rolí pokrývající zadání.

---

## Co bych ještě udělal

- SMS připomínka 24h před návštěvou (Twilio)
- Email potvrzení s kalendářovou pozvánkou (SendGrid + iCal)
- Waitlist — notifikace při uvolnění termínu u oblíbeného mistra
- Cancellation policy — konfigurovatelná lhůta a pokuta
- Granulární role — recepce nemůže měnit ceny
- Audit log — kdo a kdy změnil/zrušil rezervaci
- PWA manifest — "Přidat na plochu" pro mobilní klienty
- Volitelná registrace klientů pro historii napříč zařízeními

---

## Co bych udělal jinak v produkci

**Firestore security rules** — aktuálně permisivní pro MVP. V produkci: klienti nemohou číst cizí rezervace, zápis do `bookings` pouze přes Cloud Functions (not client SDK), admini mají přístup podle role z custom claims.

**Rate limiting** — Cloud Functions nemají ochranu proti spamu. V produkci: Firebase App Check + rate limiting na úrovni Cloud Run.

**Timezone handling** — místo hardcoded `+02:00` ukládat timezone salónu do konfigurace a používat `date-fns-tz` pro konverze.

**Monitoring** — Sentry pro frontend error tracking, Cloud Monitoring pro Functions latency a error rate.

**CI/CD** — GitHub Actions: lint + type-check při PR, automatický deploy při merge do `main`.

**Testy** — unit testy pro algoritmus slotů (nejkritičtější business logika s mnoha edge cases), integration test pro `createBooking` transakci.

**Zálohy** — scheduled Firestore export do Cloud Storage, retention 30 dní.

---

## Známé bugy a omezení

- **Timezone hardcoded** — systém předpokládá UTC+2. Při letním/zimním čase může dojít k hodinové odchylce ve výpočtu slotů.
- **Kalendář v adminpanelu** — na malých obrazovkách (< 768px) je horizontální scroll nutný, layout není plně adaptivní pro mobil.
- **Algoritmus slotů načítá všechny bronie mistra** — bez date range filtru (kvůli timezone). Pro velmi vytížený salón s historií 1000+ rezervací by to mohlo být pomalé. Řešení: ukládat `dateString` pole přímo na dokument rezervace.
- **localStorage repeat booking** — nefunguje v incognito nebo po vymazání cache.
- **Souběžné rezervování** — transakce správně zachytí konflikt, ale UX error hláška by mohla být přívětivější (nabídnout nejbližší volný termín).

---

## Notifikace — mock vs produkce

| Typ | Aktuální stav | Produkční řešení | Důvod volby |
|-----|--------------|-----------------|-------------|
| SMS potvrzení | `console.log` | **Twilio** | Spolehlivost, česká čísla, jednoduché Node.js SDK, pay-per-use |
| Email potvrzení | `console.log` | **SendGrid** | Šablony, analytika doručení, vysoká doručitelnost |
| SMS připomínka | není | Twilio Scheduled Messages | Stejná platforma, konzistence |

