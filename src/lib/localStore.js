/**
 * Tryb LOKALNY (demo / MVP): wszystko w localStorage.
 * Zero konfiguracji, działa offline, ale dane są tylko na jednym urządzeniu.
 * Produkcja: patrz firebaseStore.js i przełącznik FEATURES.storageMode.
 *
 * MODEL ZDJĘĆ (zmiana): zdjęcia NIE przechodzą moderacji.
 * Każde zdjęcie ma pole `folder`. Uczestnik dodaje → folder CLUB.jubileeFolder
 * (np. "X-lecie PeKaeS") i widzi zdjęcie od razu w galerii.
 * Tylko administrator może przenieść zdjęcie do innego folderu / zmienić rok / usunąć.
 */
import { FEATURES, CLUB } from '../config.js'
import { uid, deviceId } from './id.js'

const K = {
  nickname: 'd10.nickname',
  entered: 'd10.entered',
  participants: 'd10.participants',
  photos: 'd10.photos',
  sentences: 'd10.sentences',
  game: 'd10.game',
  results: 'd10.results',
}

// Bezpieczny zapis: gdy localStorage jest niedostępny (iframe, tryb prywatny,
// polityki przeglądarki), dane trzymamy w pamięci — aplikacja działa dalej,
// a nie wywala się ekranem błędu. Stan po prostu nie przetrwa odświeżenia.
const memoryFallback = new Map()

function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
    memoryFallback.delete(key)
  } catch {
    memoryFallback.set(key, val)
  }
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw != null) return JSON.parse(raw)
  } catch {
    /* localStorage niedostępny — sprawdzamy pamięć zastępczą */
  }
  if (memoryFallback.has(key)) return memoryFallback.get(key)
  return fallback
}

const listeners = new Set()
function emit() {
  listeners.forEach((cb) => {
    try { cb() } catch { /* ignore */ }
  })
}
export function onChange(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/* ------------------------------------------------------------------ */
/* Zdjęcia przykładowe (bundlowane z aplikacją) — zastąp własnym archiwum */
const YEAR = new Date().getFullYear()
const SEED_PHOTOS = [
  { id: 'seed-1', src: './photos/photo-1.jpg', author: 'Archiwum klubu', caption: 'Pierwsza tarcza w klubie (zdjęcie przykładowe — zamień na własne)', year: '2015', folder: '2015', at: Date.now() - 1000 * 60 * 60 * 24 * 365 * 10 },
  { id: 'seed-2', src: './photos/photo-2.jpg', author: 'Archiwum klubu', caption: 'Turniej ligowy (zdjęcie przykładowe)', year: '2018', folder: '2018', at: Date.now() - 1000 * 60 * 60 * 24 * 365 * 7 },
  { id: 'seed-3', src: './photos/photo-3.jpg', author: 'Archiwum klubu', caption: 'Puchar za sezon (zdjęcie przykładowe)', year: '2021', folder: '2021', at: Date.now() - 1000 * 60 * 60 * 24 * 365 * 4 },
  { id: 'seed-4', src: './photos/photo-4.jpg', author: 'Archiwum klubu', caption: 'Zjazd jubileuszowy — to będziecie Wy!', year: String(YEAR), folder: CLUB.jubileeFolder, at: Date.now() },
]

function seedIfEmpty() {
  if (!read(K.photos, null)) write(K.photos, SEED_PHOTOS)
}

/* ------------------------------------------------------------------ */
export const localStore = {
  // subskrypcja zmian — dzięki niej UI odświeża się po każdej mutacji
  onChange,

  getNickname() {
    return read(K.nickname, '') || ''
  },
  setNickname(name) {
    const n = String(name || '').trim().slice(0, 30)
    if (n) write(K.nickname, n)
    emit()
    return n
  },

  /** Czy użytkownik przeszedł bramkę wejścia (podał poprawne hasło zjazdu). */
  getEntered() {
    return read(K.entered, false) === true
  },
  setEntered() {
    write(K.entered, true)
    emit()
  },

  registerParticipant() {
    const id = deviceId()
    const list = read(K.participants, [])
    if (!list.some((p) => p.id === id)) {
      list.push({ id, name: this.getNickname() || 'Gość', at: Date.now() })
      write(K.participants, list)
      emit()
    }
    return list.length
  },
  countParticipants() {
    return read(K.participants, []).length
  },
  /** W trybie lokalnym licznik jest w pamięci — odświeżanie zbędne. */
  async refreshParticipants() {},

  /* -------------------- ZDJĘCIA (foldery) -------------------- */
  listPhotos() {
    seedIfEmpty()
    return read(K.photos, [])
  },
  /** Nowe zdjęcie od razu trafia do galerii (folder CLUB.jubileeFolder). */
  async addPhoto({ author, caption, year, folder, dataUrl, thumbDataUrl }) {
    seedIfEmpty()
    const list = read(K.photos, [])
    const photo = {
      id: uid(),
      src: dataUrl,
      author: author || 'Anonim',
      caption: caption || '',
      year: year || String(YEAR),
      folder: folder || CLUB.jubileeFolder,
      at: Date.now(),
    }
    list.push(photo)
    write(K.photos, list)
    emit()
    return photo
  },
  updatePhoto(id, patch) {
    const list = read(K.photos, []).map((p) => (p.id === id ? { ...p, ...patch } : p))
    write(K.photos, list)
    emit()
  },
  /** Akcja zbiorcza: np. przeniesienie do folderu / zmiana roku wielu zdjęć naraz. */
  updatePhotos(ids, patch) {
    const set = new Set(ids)
    const list = read(K.photos, []).map((p) => (set.has(p.id) ? { ...p, ...patch } : p))
    write(K.photos, list)
    emit()
  },
  deletePhoto(id) {
    write(K.photos, read(K.photos, []).filter((p) => p.id !== id))
    emit()
  },
  deletePhotos(ids) {
    const set = new Set(ids)
    write(K.photos, read(K.photos, []).filter((p) => !set.has(p.id)))
    emit()
  },

  /* -------------------- ZDANIA (gra) -------------------- */
  listSentences() {
    return read(K.sentences, [])
  },
  addSentence({ author, text }) {
    const list = read(K.sentences, [])
    const s = {
      id: uid(),
      author: (author || '').trim().slice(0, 30),
      text: (text || '').trim(),
      deviceId: deviceId(),
      status: 'pending',
      at: Date.now(),
    }
    list.push(s)
    write(K.sentences, list)
    emit()
    return s
  },
  updateSentence(id, patch) {
    write(K.sentences, read(K.sentences, []).map((s) => (s.id === id ? { ...s, ...patch } : s)))
    emit()
  },
  deleteSentence(id) {
    write(K.sentences, read(K.sentences, []).filter((s) => s.id !== id))
    emit()
  },

  getGameStatus() {
    const g = read(K.game, { status: 'collect', minSentences: FEATURES.minSentencesToStart })
    if (typeof g.minSentences !== 'number') g.minSentences = FEATURES.minSentencesToStart
    return g
  },
  setGameStatus(patch) {
    write(K.game, { ...this.getGameStatus(), ...patch })
    emit()
  },

  /* -------------------- WYNIKI -------------------- */
  listResults() {
    return read(K.results, [])
  },
  addResult({ game, author, score, max, timeMs }) {
    const list = read(K.results, [])
    list.push({ id: uid(), game, author: author || 'Anonim', score, max, timeMs: timeMs || 0, at: Date.now() })
    write(K.results, list)
    emit()
    return list
  },
  clearResults() {
    write(K.results, [])
    emit()
  },

  resetAll() {
    try {
      Object.values(K).forEach((k) => localStorage.removeItem(k))
      localStorage.removeItem('d10.deviceId')
    } catch { /* brak dostępu do storage */ }
    memoryFallback.clear()
    emit()
  },

  debugDump() {
    return {
      nick: this.getNickname(),
      participants: this.countParticipants(),
      photos: this.listPhotos().length,
      sentences: this.listSentences(),
      game: this.getGameStatus(),
      results: this.listResults(),
    }
  },
}
