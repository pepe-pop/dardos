# 🎯 Dart 10 — aplikacja na 10-lecie klubu darta

Mobile-first aplikacja webowa (PWA) na zjazd jubileuszowy: **QR → pseudonim → historia, galeria, gry, „Kto to powiedział?"**. Zero kosztów (GitHub Pages + Firebase darmowy plan). Po zjeździe zostaje jako cyfrowe archiwum klubu.

Pełna dokumentacja projektowa: **[KONCEPCJA.md](KONCEPCJA.md)** • Checklista przed eventem: **[CHECKLISTA.md](CHECKLISTA.md)**

## Funkcje

- 🏠 Strona główna: logo klubu, licznik do zjazdu, licznik uczestników, onboarding pseudonimu
- 🗓️ Interaktywna historia klubu (oś czasu, statystyki, cytaty — treści w `src/data/`)
- 📸 Galeria: przeglądanie, filtry wg folderów, lightbox, **dodawanie zdjęć z aparatu/galerii** (kompresja; zdjęcia widoczne od razu, trafiają do folderu „X-lecie PeKaeS")
- 🎯 Mini gry: quiz, **Lotka 501 (double out z animacją lecącej lotki)**, **Zgadnij rok**, memory, bingo klubowe
- 🎭 „Kto to powiedział?" — zbiórka zdań → moderacja → rozgrywka → ranking
- 🔐 Panel organizatora (`#/admin` + klucz): zarządzanie zdjęciami (foldery, rok, usuwanie — także zbiorczo), moderacja zdań, sterowanie grą, backup JSON
- 🏆 Konfetti i rekordy w każdej grze
- 📱 PWA: działa offline, „dodaj do ekranu głównego"

## Szybki start (tryb demo — zero konfiguracji)

```bash
npm install
npm run dev        # lokalnie: http://localhost:5173
```

Domyślnie dane trzymane są w **localStorage** (`storageMode: 'local'`) — wszystko działa od razu, nawet offline. Do wspólnych danych wszystkich uczestników podłącz Firebase (rozdział 9 w KONCEPCJA.md):

```bash
npm install        # już masz
# 1) wypełnij src/firebase-config.js danymi z konsoli Firebase
# 2) w src/config.js ustaw FEATURES.storageMode = 'firebase'
# 3) wgraj reguły z firebase/ (zmień sekret admina!)
npm run build
```

## Deploy na GitHub Pages

1. Załóż publiczne repo i wypchnij kod (`git push` na gałąź `main`).
2. Repo → **Settings → Pages → Source: GitHub Actions**.
3. Workflow `.github/workflows/deploy.yml` sam zbuduje i wdroży aplikację.
4. Otwórz `https://TWOJ-NICK.github.io/darts10/`.

## QR kod

```bash
npm run qr -- "https://TWOJ-NICK.github.io/darts10/"   # → qr-zjazd.png
```

## Konfiguracja (minimalna przed eventem)

| Co | Gdzie |
|---|---|
| Nazwa klubu, data/miejsce zjazdu, klucz admina | `src/config.js` |
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

Prototyp przeszedł automatyczny test przeglądarkowy (Playwright, Chromium): wszystkie podstrony, onboarding, dodawanie zdań/zatwierdzanie/gra, quiz, lotka, memory, bingo, ranking — **bez błędów konsoli**. Test punktacji tarczy: 11/11 przypadków zgodnych z prawdziwą geometrią.

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
| **Klucz panelu organizatora** | `FEATURES.adminKey` (ZMIEŃ na własny, długi ciąg!) |
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
