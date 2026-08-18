/**
 * KONFIGURACJA APLIKACJI — wszystko co musisz dostosować do swojego klubu.
 * Zobacz sekcję „Gdzie zmienić treści" w README.md.
 *
 * 🔐 HASŁA I KLUCZE (adminKey, appPassword, klucze Firebase) NIE są tu na sztywno.
 * Pochodzą ze zmiennych środowiskowych Vite (plik .env — ignorowany przez gita,
 * lub sekrety GitHub Actions przy deployu). Poniższe wartości to TYLKO fallbacki
 * do trybu demo — w produkcji ustaw VITE_APP_PASSWORD i VITE_ADMIN_KEY.
 */
export const CLUB = {
  name: 'PeKaeS x PeKaeSsa',          // TODO: pełna nazwa klubu
  shortName: 'DARDOS',                // TODO: skrót / logo
  city: 'Zamość',
  foundedYear: 2016,
  eventDate: '2026-08-21T15:00:00+02:00', // TODO: data i godzina zjazdu (format ISO)
  eventPlace: 'Ranczo DEBRY Skierbieszów', // TODO: miejsce
  eventLabel: 'X-lecie najlepszych darterów w Polsce',
  /** Domyślny folder, do którego trafiają zdjęcia dodane przez uczestników
   *  (tylko administrator może przenieść je do innych folderów). */
  jubileeFolder: 'X-lecie PeKaeS',

  /** 🎬 Film wyróżniony na stronie głównej („Film zjazdu").
   *  Wpisz tu ID dokumentu filmu z galerii (np. '2026-zjazd-caly'),
   *  ALBO zostaw puste i wybierz film w panelu administratora (Zdjęcia → „Film na start").
   *  Priorytet ma wybór z panelu admina. */
  featuredVideo: '',
};

export const FEATURES = {
  /** 'local'  = demo bez backendu (localStorage) — działa od razu, zero konfiguracji
   *  'firebase' = produkcja (Firestore + Storage) — wymaga sekretów w .env / GitHub Secrets */
  storageMode: 'local',

  /** 🔐 Hasło wejścia do aplikacji dla UCZESTNIKÓW (inne niż klucz admina!).
   *  Ustaw w .env: VITE_APP_PASSWORD=twoje-tajne-haslo */
  appPassword: import.meta.env.VITE_APP_PASSWORD || 'dart10',

  /** 🔐 Klucz panelu organizatora (#/admin). Ustaw w .env: VITE_ADMIN_KEY=tajny-klucz */
  adminKey: import.meta.env.VITE_ADMIN_KEY || 'dart10-admin',

  /** Gra „Kto to powiedział?" startuje po min. tylu ZATWIERDZONYCH zdaniach (może też ręcznie admin) */
  minSentencesToStart: 6,
  maxSentenceLen: 160,
  minSentenceLen: 10,

  /** Ograniczenia uploadu zdjęć */
  photoMaxBytes: 5 * 1024 * 1024, // 5 MB przed kompresją
  photoMaxWidth: 1600,            // max szerokość/wysokość po kompresji
  photoQuality: 0.75,
  thumbWidth: 520,                // miniaturka do siatki
  thumbQuality: 0.7,
};

// Ostrzeżenie, jeśli działamy na domyślnych (demo) hasłach
if (import.meta.env.PROD || import.meta.env.DEV) {
  if (FEATURES.adminKey === 'dart10-admin' || FEATURES.appPassword === 'dart10') {
    console.warn(
      '⚠️ Używasz domyślnych haseł demo. Ustaw VITE_APP_PASSWORD i VITE_ADMIN_KEY ' +
      '(plik .env lokalnie / sekrety GitHub Actions) — szczegóły w README.md.'
    )
  }
}
