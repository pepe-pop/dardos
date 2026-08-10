/**
 * KONFIGURACJA FIREBASE (tryb produkcyjny) — wartosci ze zmiennych środowiskowych!
 *
 * Klucze Firebase NIE są wpisane na stałe — pochodzą z pliku .env (ignorowanego
 * przez gita) albo z sekretów GitHub Actions przy deployu. Dzięki temu dane
 * poufne nie trafiają do publicznego repozytorium.
 *
 * 1) Skopiuj .env.example → .env i wklej dane swojego projektu Firebase
 *    (console.firebase.google.com → Twoje aplikacje → Aplikacja web </>).
 * 2) W GitHub: Settings → Secrets and variables → Actions → dodaj sekrety VITE_*.
 * 3) Ustaw FEATURES.storageMode = 'firebase' w src/config.js.
 */
export default {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'PLACEHOLDER',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'PLACEHOLDER.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'PLACEHOLDER',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'PLACEHOLDER.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:PLACEHOLDER',
}
