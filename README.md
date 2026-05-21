# ✂️ Salon Élégance — Rezervační systém

Fullstack rezervační systém pro kadeřnický salon. Case study pro výběrové řízení na pozici **AI Application Developer**.

---

## 🌐 Live demo

| | |
|---|---|
| **Klientská část** | https://salon-booking-2026-fb245.web.app |
| **Admin panel** | https://salon-booking-2026-fb245.web.app/admin |

---

## 🔑 Přístupové údaje

| Role | E-mail | Heslo |
|------|--------|-------|
| Majitelka (owner) | `owner@salon.cz` | `admin123` |
| Recepce | `recepce@salon.cz` | `recep123` |

---

## 📸 Screenshots

### Klientská část — výběr služby
Tříkrokový booking flow — výběr služby, mistra a termínu. Bez registrace, optimalizováno pro mobil.

### Admin — týdenní kalendář
Real-time kalendář s Firestore `onSnapshot` subscriptions. Změny se projeví okamžitě bez refreshe stránky.

---

## 🏗 Architektura

### Backend — Firebase ekosystém

**Proč Firebase místo vlastního serveru?**  
Zadání explicitně požaduje Firebase. Zvolil jsem konkrétní produkty takto:

| Produkt | Použití | Důvod volby |
|---------|---------|-------------|
| **Firestore** | Hlavní databáze | Strukturované dotazy, kompozitní indexy, transakce, real-time subscriptions |
| **Cloud Functions v2** | Business logika | Server-side validace, prevence race condition, bezpečnost |
| **Firebase Auth** | Autentizace adminů | Email+heslo, jednoduché, spolehlivé |
| **Firebase Hosting** | Frontend hosting | HTTPS, CDN, automatický deploy, nulová konfigurace |

**Proč ne Realtime Database?**  
Realtime DB nepodporuje složené dotazy (`where A AND B AND C`) ani serverové transakce — oboje je kritické pro správu rezervací.

### Klíčové architektonické rozhodnutí — transakce

`createBooking` Cloud Function používá Firestore transakci, která atomicky:
1. Zkontroluje konflikty v rozvrhu mistra
2. Zapíše rezervaci
3. Uloží/aktualizuje profil klienta

Klient **nikdy nepíše přímo** do kolekce `bookings`. Tím je fyzicky nemožné vytvořit duplicitní rezervaci při souběžném přístupu.

### Frontend — React + TypeScript + Vite + Tailwind

UX klientské části je postaven na tříkrokovém lineárním flow — výběr služby, termínu a zadání kontaktů. Minimalizuje kognitivní zátěž a funguje bez registrace.

---

## 🚀 Spuštění lokálně

### Varianta A — Docker (doporučeno)

```bash
# 1. Klonovat
git clone https://github.com/bkozarik/salon-booking-2026
cd salon-booking-2026

# 2. Environment variables
cp .env.example .env
# Vyplnit FIREBASE_TOKEN (získat přes: firebase login:ci)

cp src/.env.example src/.env
# Vyplnit Firebase config hodnoty

# 3. Spustit
docker-compose up
```

**Aplikace poběží na:**
- `http://localhost:5173` — klientská část
- `http://localhost:4000` — Firebase Emulator UI

### Varianta B — Manuálně

**Požadavky:** Node.js 20+, Java 17+, `firebase-tools`

```bash
# Závislosti
cd functions && npm install && npm run build && cd ..
cd src && npm install && cd ..

# Firebase emulátor
firebase emulators:start --import=./emulator-data

# Seed dat (nový terminál)
cd src
npx tsx src/firebase/runSeed.ts
npx tsx src/firebase/createAdminDocs.ts

# Frontend dev server (nový terminál)
cd src
npm run dev
```

### E2E testy

```bash
cd src
npm run dev          # terminál 1
npx playwright test  # terminál 2
```

---

## 🤔 Předpoklady (assumptions)

Zadání bylo záměrně neúplné. Zde jsou rozhodnutí, která jsem udělal samostatně:

**Kombinované služby vždy u jednoho mistra**  
Alternativa (různé služby u různých mistrů) by exponenciálně zkomplikovala algoritmus slotů. Pokrývá 90 % reálných případů. Dokumentováno jako known limitation.

**Cena za délku vlasů není v systému**  
Zadání explicitně říká: *"to ale salon zatím řeší až na místě."* Respektováno.

**Timezone pevně UTC+2 (Praha)**  
Cloud Functions používají hardcoded offset. Pro mezinárodní použití by bylo nutné ukládat timezone salónu do konfigurace.

**Opakovaná rezervace přes localStorage**  
Bez registrace — klient je rozpoznán na zařízení po dobu 90 dní. Kompromis mezi UX a jednoduchostí implementace.

**Zrušení rezervace bez sankce**  
Cancellation policy není v zadání zmíněna — rozhodl jsem ve prospěch jednoduchosti MVP.

**Role: owner a receptionist**  
Owner: vše včetně analytiky a správy služeb/mistrů.  
Receptionist: kalendář a rezervace. Minimální set pokrývající zadání.

**Algoritmus slotů bez date-range filtru**  
Kvůli timezone problémům s Firestore Timestamp queries načítám všechny aktivní rezervace mistra a filtruji průnik v kódu. Pro salon s < 1000 rezervacemi na mistra je výkon dostatečný. V produkci: přidat `dateString` pole na dokument.

---

## 📋 Co bych ještě udělal

- [ ] SMS připomínka 24h před návštěvou (Twilio)
- [ ] Email potvrzení s `.ics` kalendářovou pozvánkou (SendGrid)
- [ ] Waitlist — notifikace při uvolnění termínu u oblíbeného mistra
- [ ] Cancellation policy — konfigurovatelná lhůta a sankce
- [ ] Granulární role — recepce nemůže měnit ceny a služby
- [ ] Audit log — kdo a kdy změnil/zrušil rezervaci
- [ ] PWA manifest — "Přidat na plochu" pro mobilní klienty
- [ ] Volitelná registrace klientů pro historii napříč zařízeními
- [ ] Správa výjimek v rozvrhu (dovolené, nemoc) přímo z admin UI

---

## ⚙️ Co bych udělal jinak v produkci

**Firestore security rules**  
Aktuálně permisivní pro MVP. V produkci: klienti nemohou číst cizí rezervace, zápis do `bookings` pouze přes Cloud Functions, admini mají granulární přístup z Firebase custom claims.

**Rate limiting**  
Veřejné Cloud Functions nemají ochranu proti spamu. V produkci: Firebase App Check + rate limiting middleware.

**Timezone handling**  
Místo hardcoded `+02:00` ukládat timezone salónu do Firestore konfigurace a používat `date-fns-tz` pro konverze.

**Monitoring & alerting**  
Sentry pro frontend error tracking, Cloud Monitoring pro Functions latency a error rate, PagerDuty pro kritické alerty.

**CI/CD**  
GitHub Actions: lint + type-check + E2E testy při PR, automatický deploy při merge do `main`.

**Zálohy**  
Scheduled Firestore export do Cloud Storage, retention 30 dní.

**Testy**  
Unit testy pro algoritmus slotů (nejkritičtější business logika s mnoha edge cases — timezone, výjimky v rozvrhu, přechody přes půlnoc), integration testy pro `createBooking` transakci.

---

## 🐛 Známé bugy a omezení

| Bug | Závažnost | Popis |
|-----|-----------|-------|
| Timezone hardcoded | Střední | Systém předpokládá UTC+2. Při přechodu na letní/zimní čas může dojít k hodinové odchylce. |
| Algoritmus slotů | Nízká | Načítá všechny rezervace mistra bez date filtru. Pomalé při 1000+ rezervacích. |
| Kalendář na mobilu | Nízká | Při mnoha mistrech je nutný horizontální scroll, layout není plně optimalizován. |
| localStorage | Nízká | Repeat booking nefunguje v incognito nebo po vymazání cache. |
| Race condition UX | Nízká | Při konfliktu transakce zobrazí chybu, ale nenabídne nejbližší volný termín. |

---

## 📬 Notifikace — mock vs produkce

| Typ | Aktuální stav | Produkční řešení | Důvod volby |
|-----|--------------|-----------------|-------------|
| SMS potvrzení | `console.log` | **Twilio** | Spolehlivost, česká čísla, jednoduché Node.js SDK, pay-per-use |
| Email potvrzení | `console.log` | **SendGrid** | Šablony, analytika doručení, vysoká doručitelnost |
| SMS připomínka | není | Twilio Scheduled Messages | Stejná platforma jako SMS potvrzení |

---

## 🔄 PR — co bych refaktoroval jako první

**Přesunout logiku slotů do sdíleného balíčku s testy**

Aktuálně logika pracovní doby (weeklySchedule + exceptions + timezone) existuje pouze v Cloud Function `getAvailableSlots` a nemá žádné testy. Jde o nejkritičtější business logiku systému.

**Navrhovaný refaktor:**
1. Vytvořit `packages/scheduling` jako npm workspace package
2. Extrahovat a otestovat algoritmus (edge cases: svátky, výjimky v rozvrhu, DST přechody)
3. Importovat v Cloud Function pro autoritativní výpočet
4. Importovat ve frontendu pro optimistické UI (zobrazit skeleton kalendáře okamžitě)
5. Přidat `dateString: "2026-05-27"` pole na booking dokumenty → umožní efektivní date-range query bez timezone problémů

**Proč jako první:** Bez testů nelze bezpečně refaktorovat zbytek systému. Tato logika má nejvíce edge cases a nejvyšší dopad na UX při chybě.

---

## 📁 Struktura projektu

```
salon-booking-2026/
├── functions/              # Cloud Functions (TypeScript)
│   └── src/index.ts        # createBooking, cancelBooking, updateBookingStatus, getAvailableSlots
├── src/                    # React frontend (Vite + TypeScript)
│   ├── e2e/                # Playwright E2E testy
│   └── src/
│       ├── admin/          # Admin panel komponenty
│       ├── client/         # Klientský booking flow + landing
│       ├── firebase/       # Firebase konfigurace a seed skripty
│       └── shared/         # Sdílené typy, hooky, komponenty
├── firebase.json           # Firebase konfigurace
├── firestore.rules         # Firestore security rules
├── docker-compose.yml      # Lokální spuštění
└── README.md
```
