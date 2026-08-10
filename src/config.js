/**
 * KONFIGURACJA APLIKACJI — wszystko co musisz dostosować do swojego klubu.
 * Zobacz sekcję „Edycja treści" w KONCEPCJA.md.
 */
export const CLUB = {
  name: 'PeKaeS x PeKaeSsa',          // TODO: pełna nazwa klubu
  shortName: 'DARDOS',                // TODO: skrót / logo
  city: 'Zamość',
  foundedYear: 2016,
  eventDate: '2026-08-21T15:00:00+02:00', // TODO: data i godzina zjazdu (format ISO)
  eventPlace: 'Ranczo DEBRY Skierbieszów', // TODO: miejsce
  eventLabel: '10-lecie PeKaeSu',
  /** Domyślny folder, do którego trafiają zdjęcia dodane przez uczestników
   *  (tylko administrator może przenieść je do innych folderów). */
  jubileeFolder: 'X-lecie PeKaeS',
};

export const FEATURES = {
  /** 'local'  = demo bez backendu (localStorage) — działa od razu, zero konfiguracji
   *  'firebase' = produkcja (Firestore + Storage) — wymaga src/firebase-config.js
   */
  storageMode: 'local',

  /** Klucz panelu organizatora (ścieżka #/admin). ZMIEŃ na własny, długi ciąg. */
  adminKey: 'pekaes-admin2016',

  /** Gra „Kto to powiedział?" startuje po min. tylu ZATWIERDZONYCH zdaniach (może też ręcznie admin) */
  minSentencesToStart: 6,
  maxSentenceLen: 200,
  minSentenceLen: 10,

  /** Ograniczenia uploadu zdjęć */
  photoMaxBytes: 5 * 1024 * 1024, // 5 MB przed kompresją
  photoMaxWidth: 1600,            // max szerokość/wysokość po kompresji
  photoQuality: 0.75,
  thumbWidth: 520,                // miniaturka do siatki
  thumbQuality: 0.7,
};
