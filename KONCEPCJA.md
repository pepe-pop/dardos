# Koncepcja aplikacji jubileuszowej — „10 lat klubu darta" 🎯

> Kompletny projekt: koncepcja, architektura, stack, moduły, model danych, gry, wdrożenie.
> Do tego repozytorium zawiera **działający prototyp** (React + Vite + Tailwind, PWA) — patrz `README.md`.

---

## 1. Streszczenie rozwiązania

Budujemy **mobilną aplikację webową (PWA)** towarzyszącą zjazdowi 10-lecia klubu darta. Uczestnicy wchodzą do niej przez **kod QR** (bez logowania i rejestracji), podają raz pseudonim (zapisany lokalnie) i mają pod ręką:

- **stronę główną** z **bramką wejścia (pseudonim + hasło zjazdu)**, licznikiem do zjazdu i licznikiem uczestników,
- **interaktywną historię klubu** (oś czasu 2015→2025, statystyki, cytaty),
- **galerię zdjęć** (archiwalne + dodawanie nowych z telefonu, z kompresją; zdjęcia widoczne od razu i porządkowane w folderach przez organizatora),
- **mini gry** (quiz, wirtualna lotka, memory, bingo klubowe),
- **specjalną grę „Kto to powiedział?"** (zbieranie zdań → moderacja → rozgrywka → ranking),
- **panel organizatora** (ukryta ścieżka `#/admin` z kluczem) do moderacji i sterowania grą.

**Zasady projektowe (priorytety):**
1. Prostota i niezawodność — MVP działa od pierwszego dnia, bez zewnętrznych zależności.
2. Mobile-first — projektowane pod telefony (Android + iPhone), duże przyciski, dolna nawigacja.
3. Zero kosztów — GitHub Pages + (opcjonalnie) Firebase darmowy plan.
4. Prywatność — bez kont, bez danych wrażliwych; pseudonim zapisany lokalnie.
5. Pamiątka — po zjeździe aplikacja zostaje jako cyfrowe archiwum klubu.

**Dwa tryby działania (jedna baza kodu):**

| Tryb | Kiedy | Dane |
|---|---|---|
| `local` (domyślny) | demo / próba generalna / MVP | localStorage — zero konfiguracji, działa offline |
| `firebase` | dzień zjazdu | Firestore + Firebase Storage — wspólne dane dla wszystkich |

Przełącza się jednym flagą `FEATURES.storageMode` w `src/config.js`. Cała reszta aplikacji nie wie, gdzie siedzą dane (wzorzec adaptera: `src/lib/store.js`).

---

## 2. Rekomendowany stack technologiczny

| Warstwa | Technologia | Uzasadnienie |
|---|---|---|
| Frontend | **React 18 + Vite** | dojrzały, szybki dev-server, mały bundle; wymóg „React + Vite lub lekkie nowoczesne rozwiązanie" spełniony |
| Routing | **React Router v6 + HashRouter** | `#/galeria` — działa na GitHub Pages **bez konfiguracji serwera** (brak przekierowań 404) |
| Stylowanie | **Tailwind CSS v4** | utility-first, mały CSS (~7 kB gzip po buildzie), szybkie prototypowanie; spójny system kolorów z tarczy |
| Hosting | **GitHub Pages** (Actions) | darmowy, HTTPS, 1 GB limitu strony, ~100 GB/mies. transferu (soft) — dla eventu aż nadto |
| Baza danych | **Firestore (Firebase Spark)** | darmowy limit 1 GiB / 50 tys. odczytów dziennie — wystarczy na 100–200 osób; prosty SDK po stronie klienta |
| Storage zdjęć | **Firebase Storage (Spark)** | 5 GiB, ~1 GiB transferu dziennie; upload bez logowania, reguły bezpieczeństwa |
| PWA | manifest + service worker (własny, ~50 linii) | działa offline, „dodaj do ekranu głównego", ikona na telefonie |
| QR | własny skrypt (`scripts/make-qr.mjs`, pakiet `qrcode`) | kod QR generowany lokalnie z finalnego URL |

**Dlaczego NIE Supabase?** Darmowy plan usypia projekt po **7 dniach bez aktywności** — ryzyko, że przed zjazdem projekt „zaśnie", a w trakcie imprezy zabraknie czasu na odpalanie. Limit storage to 1 GB, a do tego 500 MB bazy. Firestore + Storage dają wyższe progi i nie usypiają projektów na Spark.
**Dlaczego NIE Cloudinary?** 25 kredytów/mies. (1 GB storage **albo** 1 GB transferu **albo** 1000 transformacji na kredyt) — kredyty współdzielą storage z transferem, co przy galerii zdjęć wyczerpie się szybciej niż progi Firebase. Cloudinary ma sens jako CDN + automatyczne transformacje, ale u nas kompresję robimy po stronie klienta, więc to zbędna warstwa.
**Dlaczego GitHub Pages zamiast Netlify/Vercel?** darmowy, bez ograniczeń typu „projekt uśpiony", działa z repozytorium — jedno miejsce na kod i stronę.

> **Stack docelowy (event):** React+Vite → build statyczny → GitHub Pages; Firestore + Firebase Storage; PWA; QR.
> **Stack MVP (demo):** to samo, ale z `storageMode: 'local'` — zero kont, zero kluczy.

---

## 3. Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                    TELEFON UCZESTNIKA (PWA)                  │
│                                                             │
│  QR → https://user.github.io/darts10/  (bez logowania)      │
│                                                             │
│  React SPA (HashRouter)                                     │
│  ├── Start / Historia / Galeria / Gry / Kto to? / Admin     │
│  ├── komponenty UI (mobile-first, Tailwind)                 │
│  └── lib/store.js ───── adapter ─────────────────┐          │
└──────────────────────────────────────────────────┼──────────┘
                                                   ▼
                          ┌──────────────────────────────────┐
                          │  storageMode: 'local'            │
                          │  localStorage (demo/offline)     │
                          └──────────────────────────────────┘
                          ┌──────────────────────────────────┐
                          │  storageMode: 'firebase'         │
                          │  Firestore (dane tekstowe)       │
                          │  Storage (zdjęcia, JPG ≤5 MB)    │
                          └──────────────────────────────────┘
                                                   ▲
                        (reguły bezpieczeństwa: firebase/*.rules)
```

**Kluczowe decyzje architektoniczne:**

1. **Adapter danych (`store.js`)** — jeden interfejs (`getNickname`, `listPhotos`, `addPhoto`, `addSentence`, `setGameStatus`, `addResult`, …), dwie implementacje. Przejście demo→produkcja to zmiana jednej linijki w configu.
2. **Kompresja zdjęć po stronie klienta** (canvas) — przed uploadem. Z 3–6 MB robi się 150–400 KB: oszczędza transfer (słaby internet na sali!), limity Firebase i czas wgrywania.
3. **Moderacja przez status** — zdjęcia i zdania mają `status: pending|approved|rejected`. Uczestnicy widzą tylko `approved` (+ swoje `pending` z plakietką „oczekuje").
4. **Brak konta = brak problemu** — identyfikacja urządzenia po `deviceId` w localStorage (służy do wykluczenia własnego zdania w grze i do deduplikacji licznika). Pseudonim to tylko etykieta.
5. **HashRouter + base './'** — build działa z dowolnej podścieżki GitHub Pages bez konfiguracji serwera.
6. **Code splitting** — moduły Firebase ładowane dynamicznie tylko w trybie `firebase`; w trybie demo bundel ma ~75 kB gzip.

---

## 4. Opis modułów

### 4.1 Strona główna (`/`)
- Hero: „10 lat", nazwa klubu, data/miejsce zjazdu (z `src/config.js`).
- **Licznik czasu do zjazdu** (dni/godz/min/sek, odświeżany co sekundę; po zjeździe komunikat „Trwa zjazd!").
- **Licznik uczestników** — po jednym „wejściu" na urządzenie (deduplikacja po `deviceId`).
- **Onboarding pseudonimu** — modal przy pierwszym wejściu; można pominąć i uzupełnić później; zapis lokalny, edycja z nagłówka.
- Karty przekierowań do sekcji + dyskretny link „dla organizatora".

### 4.2 Dostęp przez QR
- QR koduje **publiczny URL** (`https://nick.github.io/darts10/`). Bez rejestracji, bez hasła.
- Po zeskanowaniu: strona główna → ewentualny modal pseudonimu → pełna funkcjonalność.
- QR generujemy lokalnie skryptem (`npm run qr -- "URL"`) lub dowolnym generatorem; drukujemy na stolikach/ścianach. *Prototyp zawiera przykładowy `qr-zjazd.png`.*

### 4.3 Galeria zdjęć (`/galeria`)
- Siatka zdjęć (2 kolumny na telefonie), **lazy loading** (`loading="lazy"`).
- **Filtry**: wszystkie / foldery („X-lecie PeKaeS", lata) / „Moje".
- **Lightbox**: pełny ekran, podpis, autor, rok, strzałki, zamykanie tapnięciem/Escape.
- **Dodawanie BEZ moderacji**: „Zrób zdjęcie" (aparat) lub „Z galerii" (pliki) → podgląd → podpis (opcjonalny) → rok → **kompresja** → zdjęcie **od razu widoczne w galerii** w folderze `CLUB.jubileeFolder` (domyślnie „X-lecie PeKaeS").
- **Foldery**: tylko administrator może przenieść zdjęcie do innego folderu (np. rocznika), zmienić rok lub usunąć — w panelu `#/admin`, pojedynczo lub **zbiorczo** (zaznaczanie wielu zdjęć).
- Autor zdjęcia = pseudonim użytkownika.
- Ograniczenia: plik ≤ 30 MB przed kompresją, po kompresji ~1600 px, JPEG ~0.75 jakości.

### 4.4 Interaktywna historia klubu (`/historia`)
- Dane w `src/data/timeline.js` (JSON) — łatwa edycja bez programowania.
- **Oś czasu** 2015→2025: rok + tytuł + opis + ciekawostki + cytat (opcjonalnie).
- **Statystyki** „10 lat w liczbach" z animowanym count-up.
- **Cytaty członków** (`QUOTES`).
- Treści przykładowe oznaczono `[EDYTUJ]` — zastąp własnymi.

### 4.5 Mini gry (`/gry`) — szczegóły w rozdziale 7
Quiz, Wirtualna lotka, Memory, Bingo + **ranking lokalny** (najlepsze wyniki na urządzeniu; w Firebase — wspólny ranking).

### 4.6 „Kto to powiedział?" (`/kto`) — szczegóły w rozdziale 8

### 4.7 Panel organizatora (`/admin`)
- Ukryta ścieżka + klucz (domyślnie w `FEATURES.adminKey`, zmień!).
- Zakładki: **Zdjęcia** (zarządzanie folderami: przenoszenie do roczników / „X-lecie PeKaeS", zmiana roku, usuwanie — pojedynczo i **zbiorczo** przez zaznaczanie), **Zdania** (moderacja gry „Kto to powiedział?"), **Gra** (status: zbiórka→aktywna→zakończona, min. liczba zdań, statystyki), **Wyniki** (lista, czyszczenie), **Kopia zapasowa** (eksport JSON — archiwum po zjeździe).

---

## 5. Model danych

### 5.1 Firestore (produkcja)

| Kolekcja / dokument | Pola | Uwagi |
|---|---|---|
| `zdjecia/{id}` | `author, caption, year, folder, src, thumb, at` | bez moderacji; `folder` = „X-lecie PeKaeS" lub rocznik; `src`/`thumb` = URL Firebase Storage |
| `zdania/{id}` | `author, text, deviceId, status, at` | max 160 znaków; `deviceId` autora do wykluczeń w grze |
| `wyniki/{id}` | `game, author, score, max, timeMs, at` | `game`: quiz/lotka/memory/bingo/kto |
| `uczestnicy/{deviceId}` | `name, at` | jeden dokument na urządzenie = naturalna ochrona przed spamem licznika |
| `ustawienia/gra` | `status (collect/active/closed), minSentences` | status gry odczytywany przez wszystkich |
| `ustawienia/liczniki` | `uczestnicy (liczba)` | obejście braku `count()` na Spark (inkrementacja w regułach/kliencie) |

Przykładowy dokument:
```json
// zdania/abc123
{
  "author": "Zbyszek",
  "text": "Przegrywam tylko wtedy, gdy ktoś patrzy.",
  "deviceId": "m9x2k7…",
  "status": "approved",
  "at": { "seconds": 1780000000 }
}
```

### 5.2 localStorage (demo)
Te same „kolekcje" pod kluczami `d10.*` (nickname, participants, photos, sentences, game, results) — pełna zgodność pól z Firestore, więc przejście na Firebase nie wymaga zmian w UI.

---

## 6. Przechowywanie zdjęć — analiza i rekomendacja

### Porównanie darmowych opcji (stan na 2026 r.)

| | **Firebase Storage + Firestore** ✅ | Supabase Storage | Cloudinary | Google Photos |
|---|---|---|---|---|
| Darmowy limit | **5 GiB**, ~1 GiB/dzień transferu; Firestore 1 GiB | 1 GB, 5 GB/mies. egress | 25 kredytów/mies. (1 GB storage **albo** 1 GB transferu **albo** 1000 transformacji) | brak publicznego API uploadu do albumów użytkownika |
| Upload z aplikacji webowej | SDK, ~20 linii kodu, bez logowania (reguły) | SDK + reguły RLS | unsigned upload presets (klucz w JS) | nie (wymaga OAuth + uprawnień) |
| Moderacja | status w Firestore + panel admina | tabela + panel | moderacja po stronie Twojej aplikacji | brak |
| Ryzyko | praktycznie zero | **projekt usypia po 7 dniach bezczynności** | kredyty dzielone (galeria szybko je zjada) | niedostępne technicznie |
| Archiwum po zjeździe | pobranie plików z konsoli lub backup JSON | tak | tak | tylko ręcznie |

### Rekomendacja: **Firebase Storage + Firestore**
Uzasadnienie: najwyższe darmowe progi, najprostszy SDK (dokumentacja po polsku w sieci), brak „uśpienia" projektu, naturalna integracja moderacji (status dokumentu) i gotowe reguły bezpieczeństwa. Archiwizacja po zjeździe: pobranie bucketu z konsoli Firebase lub eksport JSON z panelu.

### Mechanika uploadu (zabezpieczenia)
1. **Kompresja na urządzeniu** (canvas, max 1600 px, JPEG q≈0.75) — 3–6 MB → 150–400 KB.
2. **Limit rozmiaru**: plik ≤ 30 MB przed kompresją; reguły Storage: `request.resource.size <= 5MB` i tylko `image/jpeg`.
3. **Anti-spam**: honeypot w formularzu zdania; limit 1 zdanie/urządzenie (deviceId); walidacja pól w regułach Firestore.
4. **Bez moderacji zdjęć**: zdjęcie od razu widoczne w galerii, w folderze „X-lecie PeKaeS". Porządek (przenoszenie do roczników, rok, usuwanie) — tylko administrator (reguły Firestore: update/delete tylko z kluczem admina).
5. **Bezpieczeństwo**: odczyt publiczny (reguły Firestore); zapis tylko z walidacją pól; zmiany/usuwanie tylko dla admina.

---

## 7. Propozycje gier (zaimplementowane w prototypie)

| Gra | Mechanika | Punktacja / ranking |
|---|---|---|
| 🧠 **Quiz „10 lat darta"** | 10 pytań (dart + klub), natychmiastowa informacja zwrotna z ciekawostką | poprawne odpowiedzi / 10; confetti przy ≥80% |
| 🎯 **Lotka 501 (double out)** | start 501, 3 lotki/turę, koniec na **polu podwójnym** (lub bull); **animacja lecącej lotki**; lotka ląduje z **losowym rozrzutem** w okolicy kliknięcia | liczba rzutów do wygranej (mniej = lepiej); confetti i „Nowy rekord" |
| 📅 **Zgadnij rok** | wydarzenia z osi czasu + zdjęcia z galerii; gracz typuje rok (4 opcje) | poprawne / 10, potem czas |
| 🃏 **Memory darta** | 12 kart (6 par symboli), czas + liczba ruchów | mniej ruchów/czasu = lepiej |
| 🎲 **Bingo klubowe** | karta 5×5 z hasłami z życia klubu, skreślanie, wykrywanie BINGO (linie, kolumny, przekątne) | liczba linii; confetti |
| 🎭 **Kto to powiedział?** | patrz rozdział 8 | poprawne odpowiedzi, potem czas |

**Konfetti i rekordy** — każda gra: confetti przy dobrym wyniku oraz plakietka „🏆 Nowy rekord!" + zapis rekordu na urządzeniu (w Firebase — wspólny ranking).

**Dodatkowe pomysły (wersja rozszerzona):**
- **„Tytany tarczy"** — turniej eliminacyjny 1v1 na telefonach (pass-and-play).
- **„Lotka 501 z handicapem"** — warianty wejścia (np. 301) na szybkie rundy.
- **Powiadomienia push** przy rekordach.

Rankingi: w trybie demo lokalne (per urządzenie), w trybie Firebase wspólne (kolekcja `wyniki`).

---

## 8. Specyfikacja modułu „Kto to powiedział?" 🎭

### Założenia
Każdy uczestnik dodaje **jedno prawdziwe, nieoczywiste/zabawne zdanie** o sobie. Potem wszyscy zgadują, kto co napisał. Gra działa, nawet jeśli ktoś **nie dodał zdania** — gra wszystkimi zdaniami innych.

### Faza 1 — zbiórka zdań (`/kto`, status gry: `collect`)
- **Rundy:** każda rozgrywka to osobna runda. Zbiórka → Aktywna (runda N) → Zakończona (zdania zapisane do rundy N) → ponowna Zbiórka zaczyna rundę N+1 ze świeżą pulą zdań. Zdania mają pole `round`; gra i panele filtrują po aktualnej rundzie.
- Formularz: pseudonim (prefill z nicku) + zdanie 10–160 znaków; licznik znaków.
- Walidacja: długość, lista zakazanych słów, **honeypot** (niewidoczne pole dla botów).
- **Jedno zdanie na urządzenie** — po dodaniu formularz znika; status zdania widoczny (oczekuje / w grze / odrzucone + możliwość ponowienia).
- Ostrzeżenie przy duplikacie imienia: „ktoś już używa tego imienia — dodaj inicjał".
- Pasek postępu: `X/minSentences` zatwierdzonych zdań.

### Faza 2 — uruchomienie
- Ręcznie przez admina (panel → Gra → Aktywna) **lub** automatycznie po osiągnięciu minimum (flag `autoStart`, domyślnie wyłączona — rekomendacja: ręcznie, żeby uniknąć zaskoczeń).
- Uczestnicy widzą komunikat „Gra AKTYWNA" + przycisk **Zaczynamy!**.
- Przy zbyt małej liczbie zdań (< 2) gra blokuje start komunikatem — nie da się zepsuć rozgrywki.

### Faza 3 — rozgrywka
1. Tala pytań = **zatwierdzone** zdania z **wykluczeniem własnego** (po `deviceId`, nie po imieniu — to ważne przy imiennikach!).
2. Ekran pytania: zdanie + opcje (imiona, min. 3, max 6, **poprawny autor zawsze wśród opcji**), awatary z inicjałami.
3. Po odpowiedzi: natychmiastowe ✓/✘ z odkryciem autora; przejście po ~0,5 s.
4. Pasek postępu `n/total`.

### Wynik i ranking
- Ekran wyniku: poprawnych X/Y, czas, **pełne podsumowanie** (zdanie → autor → Twoja odpowiedź, zielone/czerwone karty).
- **Ranking**: poprawne odpowiedzi (malejąco), potem czas (rosnąco); medale 🥇🥈🥉.
- Confetti przy ≥ 70%.

### Edge case'y (rozwiązania w kodzie i procesie)

| Przypadek | Rozwiązanie |
|---|---|
| Dwie osoby o tym samym imieniu | wykluczenie własnego zdania po `deviceId`; ostrzeżenie przy zapisie; admin może zmienić imię; w opcjach imię występuje raz (deduplikacja) |
| Ktoś nie dodał zdania | może grać (tala = wszystkie zdania), wynik zapisywany |
| Odświeżenie / czyszczenie localStorage | pseudonim proszony ponownie (modal), `deviceId` generowany na nowo — w trybie Firebase zdanie wciąż w bazie; w demo utrata danych lokalnych (świadome ograniczenie) |
| Za mało wpisów | gra się nie aktywuje; pasek postępu; blokada przy < 2 zdaniach |
| Spam / nieodpowiednie treści | honeypot, lista zakazanych słów, moderacja (status), limit 1/urządzenie |
| Ponowne zagranie | nowa tala (losowa kolejność), wynik nadpisywany — w rankingu zostaje najlepszy? (obecnie każdy zapis; do decyzji organizatora) |

---

## 9. Plan wdrożenia — krok po kroku

### A. Repozytorium i kod
1. Zainstaluj Node 18+ i Git. Skopiuj folder `darts10/` do nowego repo: `git init && git add . && git commit`.
2. `npm install` i `npm run dev` — sprawdź lokalnie.
3. **Ustaw hasła i sekrety** (nie w config.js!): skopiuj `.env.example` → `.env` i wpisz `VITE_APP_PASSWORD` (hasło wejścia dla uczestników) oraz `VITE_ADMIN_KEY` (klucz panelu admina). Plik `.env` jest w `.gitignore`.
4. Edytuj `src/config.js`: nazwa klubu, data/miejsce zjazdu, nazwa folderu jubileuszowego.
5. Zastąp przykładowe treści w `src/data/*.js` (historia, quiz) i zdjęcia w `public/photos/` (albo wgraj własne archiwum — patrz też „Edycja treści").

### B. GitHub Pages
6. Załóż publiczne repo np. `darts10` (GitHub). Wypchnij kod: `git remote add origin … && git push -u origin main`.
7. Repo → Settings → Pages → Source: **GitHub Actions** (workflow `.github/workflows/deploy.yml` jest już w repo — build+deploy po każdym pushu do `main`).
8. **Ustaw sekrety w GitHub**: repo → Settings → Secrets and variables → Actions → New repository secret: `VITE_APP_PASSWORD`, `VITE_ADMIN_KEY` (oraz `VITE_FIREBASE_*`, jeśli używasz Firebase). Workflow wstrzyknie je do buildu.
9. Poczekaj na zielony workflow (Actions), otwórz `https://TWOJ-NICK.github.io/darts10/`. ✅

### C. Firebase (tryb produkcyjny — tylko jeśli chcesz wspólnych danych)
8. Załóż konto Google → console.firebase.google.com → **Dodaj projekt** (bez Analytics).
9. Build → **Firestore Database** → Utwórz (tryb produkcyjny, potem reguły) → skopiuj dane projektu.
10. Build → **Storage** → Rozpocznij (domyślny bucket).
11. Build → Ustawienia projektu → **Twoje aplikacje** → Aplikacja web `</>` → skopiuj `apiKey` itd. → wklej do **`.env` (VITE_FIREBASE_*)** i sekretów GitHub — NIE do plików w repo (szczegóły: README → „🔥 Podłączanie Firebase").
12. Ustaw `FEATURES.storageMode = 'firebase'` w `src/config.js`.
13. Wgraj reguły: `firebase/firestore.rules` i `firebase/storage.rules` (konsola → Firestore → Rules; Storage → Rules) — pamiętaj o zmianie sekretu admina w obu plikach.
14. `npm run build` → commit → push → Actions wdroży nową wersję. Po wejściu aplikacja pokaże „Łączenie z bazą…", a przy błędzie — czytelny ekran z instrukcją (a nie pustą stronę). Przetestuj na telefonie: dodanie zdjęcia, zdania, gra.

### D. QR i publikacja
15. Wygeneruj QR: `npm run qr -- "https://TWOJ-NICK.github.io/darts10/"` → plik `qr-zjazd.png` → wydruk A5+.
16. **Testy przed wydarzeniem** (checklista poniżej). Rozwieś QR na sali, daj na stolikach.
17. Dzień zjazdu: uruchom grę z panelu (`#/admin` → Gra → Aktywna) po zebraniu min. liczby zdań; moderuj zdjęcia.

> **Uwaga o sekrecie admina:** klucz w `config.js` jest jawny dla każdego, kto otworzy źródła (repo publiczne). Na jednodniowy event to akceptowalny kompromis („hidden path" bez logowania). Mocniejszy wariant: weryfikacja przez Cloud Function — opis w rozdziale 10.

---

## 10. Ryzyka i uproszczenia

### Główne ryzyka

| Ryzyko | Prawdopodobieństwo | Mitygacja |
|---|---|---|
| Przekroczenie darmowych limitów Firestore (50 tys. odczytów/dzień) | niskie (100–200 osób × kilkanaście odczytów) | kompresja zdjęć, limit 500 dokumentów na zapytanie, brak realtime |
| Słabe/częściowe Wi-Fi na sali | średnie | PWA offline (cache), małe pliki (75 kB app + skompresowane zdjęcia), lazy loading |
| Spam / nieodpowiednie treści | niskie–średnie | honeypot, moderacja, limit 1 zdanie/urządzenie |
| Hasło wejścia „w kliencie" (możliwe do odczytania z kodu strony) | niskie | akceptowalna miękka ochrona na 1-dniowe wydarzenie; hasła trzymane w `.env`/sekrety GitHub, nie w repo; pełne zabezpieczenie = backend (poza budżetem 0 zł) |
| Admin nie nadąża z moderacją | średnie | panel na telefonie, szybkie zatwierdzanie jednym tapem |
| Utrata danych w trybie demo (czyszczenie localStorage) | niskie | tryb demo to tylko wersja testowa; na event Firebase |
| iOS: problem z wyborem pliku/przetwarzaniem zdjęcia | niskie | `accept="image/*"`, dwa przyciski (aparat/galeria), kompresja canvas |
| Błąd w regułach Firebase blokuje aplikację | niskie | wgranie reguł na 2 dni przed eventem + test na telefonie |

### Warianty

- **Minimalny (v1):** statyczna strona + QR → start/historia/galeria-odczyt + quiz. Hosting: GH Pages. Zero bazy. Czas: 1–2 dni.
- **Rekomendowany (v2 — zaimplementowany w prototypie):** wszystko powyżej + upload zdjęć (bez moderacji, foldery zarządzane przez admina), „Kto to powiedział?" z moderacją zdań i rankingiem, 5 mini gier (w tym Lotka 501 i Zgadnij rok), konfetti i rekordy, panel admina z akcjami zbiorczymi, PWA. Tryb demo działa od razu; Firebase podpinasz w ~1–2 h.
- **Rozszerzony (v3):** Firebase Auth (opcjonalne konta), powiadomienia push, ekran projekcji (tryb TV z rankingu na ścianę), eksport archiwum ZIP, backup do Google Photos, tryb turniejowy 1v1.

---

## 11. MVP

**Zakres MVP (v1, wersja minimalna):** strona główna + licznik, historia z JSON, galeria odczytu, quiz, pseudonim w localStorage. Wdrażane na GH Pages w jeden wieczór — gwarantowana podstawa, gdyby czas naglił.

**Zakres v2 (rekomendowany, gotowy w tym repo):** pełny prototyp opisany w rozdziale 4–8. Domyślnie działa w trybie `local` (zero konfiguracji), więc nawet bez Firebase robi wrażenie na próbie generalnej.

**Zasada:** lepsze mniejsze i stabilne MVP niż rozbudowany system, który zawiedzie na zjeździe. Każda funkcja ma tryb awaryjny (offline, brak danych = komunikat zamiast błędu).

---

## 12. Struktura repozytorium i przykładowy kod

```
darts10/
├── index.html
├── package.json / vite.config.js / .gitignore
├── .github/workflows/deploy.yml        # auto-deploy na GitHub Pages
├── firebase/
│   ├── firestore.rules                 # reguły bazy (moderacja, admin)
│   └── storage.rules                   # reguły storage (JPG ≤ 5 MB)
├── scripts/make-qr.mjs                 # generator kodu QR
├── scripts/bulk-upload.mjs             # masowy import zdjęć (kompresja + CSV + Firebase)
├── scripts/manifest.example.csv        # szablon opisu zdjęć do bulk-upload
├── public/
│   ├── favicon.svg / manifest.webmanifest / sw.js   # PWA
│   └── photos/                         # przykładowe zdjęcia (zamień na własne)
└── src/
    ├── main.jsx / App.jsx              # wejście, routing, layout, dolna nawigacja
    ├── config.js                       # ★ nazwa klubu, data, klucz admina, tryb danych
    ├── firebase-config.js              # ★ dane Firebase — czytane z .env / sekretów (VITE_FIREBASE_*)
    ├── index.css                       # motyw kolorów tarczy (Tailwind v4 @theme)
    ├── lib/
    │   ├── store.js                    # adapter: local | firebase (jeden interfejs)
    │   ├── localStore.js               # localStorage (demo, offline)
    │   ├── firebaseStore.js            # Firestore + Storage (produkcja)
    │   ├── image.js                    # kompresja zdjęć (canvas)
    │   ├── confetti.js / id.js
    ├── data/                           # ★ treści: timeline, quiz, memory, bingo
    ├── components/                     # TopBar, BottomNav, Dartboard, Lightbox, ui…
    └── pages/                          # Home, History, Gallery, Games, Quiz, Lotka,
                                        # Memory, Bingo, GameKtoTo, Admin
```

**Najważniejsze fragmenty kodu (wzorce do powielenia):**

```js
// src/lib/store.js — adapter danych
const impl = FEATURES.storageMode === 'firebase' ? firebaseStore : localStore
export const store = impl
// cała aplikacja woła np. store.addSentence({ author, text }) —
// nie wie i nie musi wiedzieć, gdzie zapisują się dane
```

```js
// src/lib/image.js — kompresja przed uploadem (rdzeń oszczędzania limitów)
export async function compressImage(file, { maxWidth = 1600, quality = 0.75 } = {}) {
  const { img, url } = await loadImage(file)      // <img src=objectURL>
  const scale = Math.min(1, maxWidth / Math.max(w, h))
  canvas.width = w * scale; canvas.height = h * scale
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)  // 3–6 MB → ~200 KB
}
```

```js
// src/pages/GameKtoTo.jsx — tala pytań budowana raz, własne zdanie wykluczone
const [deck] = useState(() => {
  const approved = store.listSentences().filter(s => s.status === 'approved')
  let d = approved.filter(s => s.deviceId !== myDevice)   // po deviceId, nie po imieniu!
  if (d.length === 0) d = approved                        // ktoś bez zdania — gra wszystkimi
  return shuffle(d)
})
```

---

## Załącznik A. Bezpieczeństwo i prywatność (streszczenie)

- Aplikacja **nie zbiera danych wrażliwych**: pseudonim (lokalnie), zdjęcia (publiczne), zdania (moderowane), wyniki gier.
- **Hasła nie są w repo**: hasło wejścia uczestników (`VITE_APP_PASSWORD`) i klucz admina (`VITE_ADMIN_KEY`) pochodzą z `.env` (gitignored) lub sekretów GitHub Actions. W `src/config.js` są tylko wartości demo-awaryjne.
- Reguły Firestore: odczyt publiczny treści; tworzenie z walidacją pól; zmiany/usuwanie tylko z kluczem admina (jawny w regułach — kompromis opisany w rozdz. 9).
- Reguły Storage: tylko `image/jpeg`, ≤ 5 MB; odczyt publiczny; admin po nagłówku `x-admin-key`.
- Anti-spam: honeypot, limity długości, 1 zdanie/urządzenie, moderacja.
- **Prywatność danych: 5 GB Storage to „wspólne archiwum klubu"** — po zjeździe można je pobrać i np. usunąć projekt (instrukcja w CHECKLISTA.md).

## Załącznik B. Edycja treści (bez programowania)

| Co edytujesz | Gdzie |
|---|---|
| Nazwa klubu, data zjazdu, miejsce, klucz admina | `src/config.js` |
| Historia klubu, statystyki, cytaty | `src/data/timeline.js` |
| Pytania quizu | `src/data/quiz.js` |
| Hasła bingo | `src/data/quiz.js` (BINGO_POOL) |
| Zdjęcia archiwalne | `public/photos/` (nazwy `photo-1..4.jpg`) |
| Min. liczba zdań do gry | `src/config.js` → `minSentencesToStart` |

## Załącznik C. Checklista przed uruchomieniem

Pełna lista: **`CHECKLISTA.md`** (w repo). Najważniejsze punkty:
- [ ] `config.js`: nazwa klubu, data, klucz admina zmieniony
- [ ] `npm run build` kończy się bez błędów; `npm run preview` działa
- [ ] GitHub Pages: URL działa, SSL (https), QR kieruje na właściwy URL
- [ ] Test na realnym iPhone i Androidzie (dodanie zdjęcia z aparatu!)
- [ ] Jeśli Firebase: reguły wgranie, `storageMode='firebase'`, test dodania zdjęcia i zdania z 2 telefonów
- [ ] Wydrukowane QR (kilka sztuk), plan B: link skrócony (bit.ly) na wypadek problemów z QR
- [ ] Panel admina: klucz przetestowany, przenoszenie zdjęć między folderami (zbiorczo), moderacja zdań, włączenie gry
- [ ] Baterie: 1–2 powerbanki dla organizatorów; aplikacja lekka (PWA bez ciężkich animacji)
