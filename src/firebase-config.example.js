/**
 * KONFIGURACJA FIREBASE (tryb produkcyjny).
 * 1) console.firebase.google.com → dodaj projekt → Dodaj aplikację (Web, </>).
 * 2) Skopiuj ten plik do src/firebase-config.js i wklej dane projektu.
 * 3) Ustaw FEATURES.storageMode = 'firebase' w src/config.js.
 * ⚠️ Plik src/firebase-config.js jest w .gitignore — NIE wgrywaj kluczy do publicznego repo.
 */
export default {
  apiKey: 'AIza...',
  authDomain: 'twoj-projekt.firebaseapp.com',
  projectId: 'twoj-projekt',
  storageBucket: 'twoj-projekt.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
}
