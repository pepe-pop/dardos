# 🎯 Dart 10 — aplikacja na 10-lecie klubu darta

Mobile-first aplikacja webowa (PWA) na zjazd jubileuszowy: **QR → pseudonim → historia, galeria, gry, „Kto to powiedział?"**. Zero kosztów (GitHub Pages + Firebase darmowy plan). Po zjeździe zostaje jako cyfrowe archiwum klubu.

Pełna dokumentacja projektowa: **[KONCEPCJA.md](KONCEPCJA.md)** • Checklista przed eventem: **[CHECKLISTA.md](CHECKLISTA.md)**

## Funkcje

- 🏠 Strona główna: **bramka wejścia (pseudonim + hasło zjazdu)**, logo klubu, licznik do zjazdu, licznik uczestników
- 🗓️ Interaktywna historia klubu (oś czasu, statystyki, cytaty — treści w `src/data/`)
- 📸 Galeria: przeglądanie, filtry wg folderów, lightbox, **dodawanie zdjęć z aparatu/galerii** (kompresja; zdjęcia widoczne od razu, trafiają do folderu „X-lecie PeKaeS")
- 🎯 Mini gry: quiz, **Lotka 501 (double out z animacją lecącej lotki i licznikiem rzutów)**, **Zgadnij rok**, memory, bingo klubowe
- 🎭 „Kto to powiedział?" — zbiórka zdań → moderacja → rozgrywka → ranking
- 🔐 Panel organizatora (`#/admin` + klucz): zarządzanie zdjęciami (foldery — **w tym nowe foldery z własną nazwą** — rok, usuwanie, także zbiorczo), moderacja zdań, sterowanie grą, backup JSON
- 🏆 Konfetti i rekordy w każdej grze
- 📱 PWA: działa offline, „dodaj do ekranu głównego"

## Szybki start (tryb demo — zero konfiguracji)

```bash
npm install
npm run dev        # lokalnie: http://localhost:5173
```

Domyślnie dane trzymane są w **localStorage** (`storageMode: 'local'`) — wszystko działa od razu, nawet offline. Do wspólnych danych wszystkich uczestników podłącz Firebase — **pełna instrukcja krok po kroku w sekcji „🔥 Podłączanie Firebase"** poniżej:

```bash
npm install        # już masz
# 1) skopiuj .env.example → .env i wpisz hasła + dane Firebase
# 2) w src/config.js ustaw storageMode: 'firebase'
# 3) wgraj reguły z firebase/ do konsoli Firebase (patrz instrukcja)
npm run build
```

## Deploy na GitHub Pages

1. Załóż publiczne repo i wypchnij kod (`git push` na gałąź `main`).
2. Repo → **Settings → Pages → Source: GitHub Actions**.
3. Repo → **Settings → Secrets and variables → Actions** → dodaj sekrety (patrz niżej).
4. Workflow `.github/workflows/deploy.yml` sam zbuduje i wdroży aplikację.
5. Otwórz `https://TWOJ-NICK.github.io/darts10/`.

## QR kod

```bash
npm run qr -- "https://TWOJ-NICK.github.io/darts10/"   # → qr-zjazd.png
```

## 🔐 Hasła i sekrety (WAŻNE — żeby nie trafiły do GitHub)

W aplikacji są **trzy rodzaje haseł/kluczy**: hasło wejścia dla uczestników, klucz panelu admina i klucze Firebase. **Żadne z nich nie jest zapisane w repo** — pochodzą ze zmiennych środowiskowych:

| Zmienna | Co robi | Gdzie ustawić |
|---|---|---|
| `VITE_APP_PASSWORD` | hasło wejścia do aplikacji (uczestnicy) | lokalnie: `.env` • GitHub: secret `VITE_APP_PASSWORD` |
| `VITE_ADMIN_KEY` | klucz panelu organizatora (`#/admin`) | lokalnie: `.env` • GitHub: secret `VITE_ADMIN_KEY` |
| `VITE_FIREBASE_*` | dane projektu Firebase (jeśli używasz) | lokalnie: `.env` • GitHub: sekrety `VITE_FIREBASE_*` |

**Jak to działa:**
1. **Lokalnie:** skopiuj `.env.example` → `.env`, wpisz hasła (np. `VITE_APP_PASSWORD=pekaes2026`). Plik `.env` jest w `.gitignore` — nie zostanie wypchnięty.
2. **Na GitHub:** ustaw te same wartości jako **sekrety** (repo → Settings → Secrets and variables → Actions → New repository secret). Workflow `deploy.yml` wstrzyknie je do buildu jako zmienne `VITE_*`.
3. Jeśli sekretu nie ustawisz, aplikacja użyje **domyślnych haseł demo** (`dart10` i `dart10-admin`) i pokaże ostrzeżenie w konsoli. **Przed zjazdem ustaw prawdziwe hasła!**

> ⚠️ **Uczciwa uwaga:** aplikacja jest statyczna (GitHub Pages), więc sprawdzenie hasła odbywa się po stronie przeglądarki — ktoś bardzo zdeterminowany mógłby odczytać hasło z kodu strony. Dla jednodniowej imprezy klubowej to akceptowalna „miękka" ochrona (blokuje przypadkowych ciekawskich). Pełne bezpieczeństwo wymagałoby backendu — to już nie mieści się w budżecie 0 zł.
> Klucze API Firebase **nie są tajne** (bezpieczeństwo zapewniają reguły w `firebase/*.rules`), ale trzymamy je w sekretach, żeby nie zaśmiecać repo.

## 🔥 Podłączanie Firebase — krok po kroku (ważne!)

Aplikacja w trybie `'firebase'` działa na **Firestore** (dane tekstowe) + **Firebase Storage** (zdjęcia). Poniżej komplet instrukcji — co zrobić w konsoli Firebase, jakie pliki wgrać i w jakie miejsce.

### Krok 1 — Utwórz projekt w konsoli Firebase
1. Wejdź na **console.firebase.google.com** → „Dodaj projekt" → nazwij go np. `darts10` → (możesz wyłączyć Analytics) → „Utwórz projekt".

### Krok 2 — Utwórz bazę Firestore
2. W menu po lewej: **Build → Firestore Database → Utwórz bazę danych**.
3. Wybierz region (dla Polski np. `eur3` / `europe-central2` — wybierz najbliższy dostępny).
4. **Tryb bezpieczeństwa:** wybierz **„Tryb produkcyjny"** (reguły wgrasz w kroku 6; w trybie testowym aplikacja też zadziała, ale do czasu wgrania reguł dostęp jest otwarty).

### Krok 3 — Utwórz Storage na zdjęcia
5. **Build → Storage → Rozpocznij** (możesz wybrać „Tryb testowy" na start — reguły i tak podmienisz w kroku 6).

### Krok 4 — Zarejestruj aplikację web i skopiuj dane
6. **Ustawienia projektu (ikona zębatka) → Twoje aplikacje → Aplikacja internetowa `</>`** → podaj nazwę (np. `darts10-web`) → zarejestruj.
7. Skopiuj obiekt konfiguracji (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

### Krok 5 — Wpisz dane do aplikacji (NIE do plików w repo!)
8. Lokalnie: skopiuj `.env.example` → `.env` i wpisz dane z kroku 7:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=twoj-projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=twoj-projekt
VITE_FIREBASE_STORAGE_BUCKET=twoj-projekt.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

9. Na GitHub (żeby działało na stronie): repo → **Settings → Secrets and variables → Actions → New repository secret** — dodaj po jednym: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` (plus `VITE_APP_PASSWORD` i `VITE_ADMIN_KEY`).

### Krok 6 — Wgraj reguły bezpieczeństwa (2 pliki, 2 miejsca w konsoli)
10. **Firestore → zakładka „Rules"** → skopiuj zawartość pliku **`firebase/firestore.rules`** → wklej w edytor → **„Publikuj"**.
11. **Storage → zakładka „Rules"** → skopiuj zawartość pliku **`firebase/storage.rules`** → wklej → **„Publikuj"**.
12. ⚠️ W obu plikach zmień **`DZISIEJSZY-TAJNY-KLUCZ-ZMIEN-MNIE`** na swój długi sekret admina (ten sam, co `VITE_ADMIN_KEY`).

> 💡 Możesz też wgrać reguły z konsoli Firebase CLI: `npm i -g firebase-tools`, `firebase login`, `firebase deploy --only firestore:rules,storage` (wymaga plików `firebase.json` + `firebase/firestore.rules` i `firebase/storage.rules` w repo). Dla jednego wydarzenia wygodniejsze jest wklejenie reguł w konsoli.

### Krok 7 — Włącz tryb Firebase i wdróż
13. W `src/config.js` ustaw: **`storageMode: 'firebase'`**.
14. `npm run build` → commit → push → GitHub Actions wdroży nową wersję.
15. Otwórz aplikację: powinien pojawić się ekran „Łączenie z bazą zjazdu…", a potem bramka wejścia (pseudonim + hasło).

### Krok 8 — Testy przed zjazdem
- Dodaj zdjęcie na jednym telefonie → sprawdź, że pojawia się na drugim (w folderze „X-lecie PeKaeS").
- Dodaj zdanie do „Kto to powiedział?" → zatwierdź w panelu admina → aktywuj grę.
- Połóż telefon w trybie samolotowym i otwórz aplikację → wczyta się z pamięci podręcznej (PWA).

### Najczęstsze błędy i jak je rozwiązać

| Objaw | Przyczyna | Rozwiązanie |
|---|---|---|
| **Pusta/„biała" strona** | stary build albo (historycznie) błąd asynchroniczności w trybie Firebase | `npm run build` + push; błąd został naprawiony (patrz niżej) |
| **„Brak konfiguracji Firebase — wypełnij .env"** | placeholdery zamiast prawdziwych danych | Krok 5: uzupełnij `.env` / sekrety GitHub |
| **„PERMISSION_DENIED"** | reguły nie wgrane albo projekt w trybie testowym z innymi regułami | Krok 6: wklej `firestore.rules` i `storage.rules` |
| **„Przekroczono czas oczekiwania…"** | zły `projectId`, brak internetu, Firebase nie odpowiada | sprawdź `VITE_FIREBASE_PROJECT_ID`, połączenie; „Spróbuj ponownie" |
| **Aplikacja działa, ale jest pusta (0 zdjęć/zdań)** | zły `projectId` — SDK „cicho" przechodzi w tryb offline | popraw `VITE_FIREBASE_PROJECT_ID` i przebuduj |
| **Hasła nie działają na stronie** | sekrety GitHub nie ustawione | Krok 5.9: dodaj `VITE_APP_PASSWORD` / `VITE_ADMIN_KEY` |

> 🛠️ **Dlaczego wcześniej „nic się nie pokazywało"?** Tryb Firebase używał w 100% asynchronicznego magazynu danych, a ekrany czytały dane synchronicznie — React nie umie wyrenderować Promise, więc aplikacja wywalała się na pustą stronę (błąd „Objects are not valid as a React child: [object Promise]"). Naprawiłem to przez **most synchronizujący** (`src/lib/firebaseBridge.js`): dane są wczytywane do lokalnej kopii i dopiero potem renderowane (ekran ładowania), a każdy błąd połączenia pokazuje czytelny ekran z instrukcją zamiast pustki.

## Konfiguracja (minimalna przed eventem)

| Co | Gdzie |
|---|---|
| Nazwa klubu, data/miejsce zjazdu, nazwa folderu jubileuszowego | `src/config.js` (sekcja `CLUB`) |
| **Hasło wejścia dla uczestników** | `.env` → `VITE_APP_PASSWORD` (secret w GitHub) |
| **Klucz panelu admina** | `.env` → `VITE_ADMIN_KEY` (secret w GitHub) |
| Historia, quiz, bingo | `src/data/*.js` |
| Zdjęcia archiwalne | `public/photos/photo-1..4.jpg` |

## Struktura

```
src/
├── config.js        # ★ konfiguracja klubu i funkcji
├── lib/             # store (adapter local/firebase), kompresja obrazów, confetti
├── data/            # treści: oś czasu, quiz, memory, bingo
├── components/      # nawigacja, tarcza SVG, lightbox, ui
└── pages/           # Home, History, Gallery, Games, Quiz, Lotka, Memory, Bingo, Kto to?, Admin
```

## Testy

Prototyp przeszedł automatyczny test przeglądarkowy (Playwright, Chromium): bramka wejścia (błędne hasło odrzucone), wszystkie podstrony, dodawanie zdań/zatwierdzanie/gra, quiz, lotka 501, zgadnij rok, memory, bingo, nowe foldery w panelu admina, ranking — **bez błędów konsoli**. Test punktacji tarczy: 11/11 przypadków zgodnych z prawdziwą geometrią.

## 🛠️ Gdzie zmienić treści aplikacji

Wszystkie treści (oprócz kodu gier) edytujesz w kilku plikach — bez programowania.

### 1. Dane klubu i wydarzenia — `src/config.js`

| Co zmieniasz | Pole |
|---|---|
| Pełna nazwa klubu (hero na stronie głównej) | `CLUB.name` |
| Skrót klubu | `CLUB.shortName` |
| Miasto | `CLUB.city` |
| Rok założenia (licznik „rok powstania") | `CLUB.foundedYear` |
| **Data i godzina zjazdu** (licznik odlicza do niej) | `CLUB.eventDate` — format ISO, np. `'2026-09-12T15:00:00+02:00'` |
| Miejsce zjazdu | `CLUB.eventPlace` |
| Etykieta wydarzenia („Zjazd 10-lecia") | `CLUB.eventLabel` |
| **Nazwa folderu na zdjęcia z zjazdu** | `CLUB.jubileeFolder` (domyślnie „X-lecie PeKaeS") |
| **Hasło wejścia dla uczestników** | `.env` → `VITE_APP_PASSWORD` (nie w config.js!) |
| **Klucz panelu organizatora** | `.env` → `VITE_ADMIN_KEY` (nie w config.js!) |
| Min. liczba zdań do startu gry „Kto to powiedział?" | `FEATURES.minSentencesToStart` |
| Maks. długość zdania w grze | `FEATURES.maxSentenceLen` |

### 2. Historia klubu — `src/data/timeline.js`

- **`TIMELINE`** — oś czasu: jeden obiekt na rok `{ year, title, text, facts[], quote }`. Zastąp przykładowe wpisy (oznaczone `[EDYTUJ]`) prawdziwą historią.
- **`STATS`** — duże liczby na górze sekcji Historia (np. liczba członków, pucharów).
- **`QUOTES`** — cytaty członków klubu.

### 3. Quiz, memory, bingo — `src/data/quiz.js`

- **`QUIZ`** — pytania quizu: `{ q, options[4], correct, fun }`. Pytania `[EDYTUJ]` zamień na własne (klubowe).
- **`MEMORY_SYMBOLS`** — pary symboli w grze memory (emoji; możesz podmienić na zdjęcia graczy).
- **`BINGO_POOL`** — hasła na kartach bingo (minimum 24, żeby każda karta była inna).

### 4. Logo klubu — `public/logo.png`

- Aplikacja pokazuje **logo na górze** (pasek nawigacji) i ma na nie przygotowane miejsce.
- **Jak zamienić:** wgraj własny plik pod nazwę `logo.png` do katalogu `public/` (najlepiej kwadratowy, ~512×512 px, PNG lub JPG — nazwa może być inna, np. `logo.jpg`, `logo.svg`). Jeśli plik zniknie lub się nie załaduje, aplikacja automatycznie pokaże odznakę „10".
- Gdybyś zmienił nazwę pliku, zaktualizuj ścieżkę w `src/components/TopBar.jsx` (`<img src="./logo.png" …>`).

### 5. Zdjęcia archiwalne — `public/photos/`

- Pliki `photo-1.jpg` … `photo-4.jpg` to przykładowe zdjęcia pokazujące się w galerii (foldery wg lat).
- Zamień je na prawdziwe zdjęcia klubu (zachowaj nazwy plików) — albo usuń pliki, a galeria zacznie pusta.

### 6. Nazwa aplikacji (PWA, ikona na telefonie) — `public/manifest.webmanifest`

- `name`, `short_name` — nazwa widoczna po „Dodaj do ekranu głównego".

### 7. Kolory i motyw — `src/index.css`

- Paleta inspirowana tarczą dartową zdefiniowana w `@theme`: `--color-night` (tło), `--color-gold` (złoto), `--color-board` (czerwień), `--color-verdant` (zieleń), `--color-cream` (krem).

### 8. Po zmianie treści

```bash
npm run build      # zbuduj nową wersję
npm run preview    # sprawdź lokalnie
# commit + push → GitHub Actions automatycznie wdroży na GitHub Pages
```

> 💡 **Wskazówka:** po większych zmianach zaktualizuj też numer wersji service workera
> w `public/sw.js` (`const VERSION = 'darts10-vN'`) — wymusi to odświeżenie cache
> u użytkowników, którzy już otwierali aplikację.
