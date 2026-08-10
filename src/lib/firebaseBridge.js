/**
 * MOST FIREBASE ↔ SYNCHRONICZNE UI.
 *
 * PROBLEM (który powodował pustą stronę w trybie 'firebase'):
 * firebaseStore jest w 100% asynchroniczny (zwraca Promise), a komponenty UI
 * czytają dane synchronicznie (store.getNickname(), listPhotos()…). React nie
 * umie renderować Promise → aplikacja wywalała się bez zawartości.
 *
 * ROZWIĄZANIE: most trzyma lokalną kopię danych (cache) i udostępnia TĘ SAMĄ
 * SYNCHRONICZNĄ stronę API co localStore:
 *   - loadAll()      — wczytuje dane z Firebase na start (woła App.jsx),
 *   - po każdej zmianie natychmiast aktualizuje cache (UI reaguje od razu),
 *     a zapis do Firebase idzie asynchronicznie w tle,
 *   - onChange()     — powiadamia UI o zmianach (jak localStore).
 */
import { firebaseStore } from './firebaseStore.js'
import { deviceId } from './id.js'

const cache = {
  nickname: '',
  entered: false,
  photos: [],
  sentences: [],
  results: [],
  game: { status: 'collect', minSentences: 6 },
  participants: 0,
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

let loadError = null
export function getLoadError() {
  return loadError
}

function withTimeout(promise, ms, msg) {
  let timer
  const to = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(msg)), ms)
  })
  return Promise.race([promise, to]).finally(() => clearTimeout(timer))
}

/**
 * Wczytuje wszystkie dane z Firebase do cache. Zwraca true (sukces) / false (błąd).
 * Timeout chroni przed wiecznym spinnerem, gdy Firebase nie odpowiada.
 */
export async function loadAll(timeoutMs = 12000) {
  loadError = null
  try {
    const data = await withTimeout(
      Promise.all([
        firebaseStore.getNickname(),
        firebaseStore.getEntered(),
        firebaseStore.listPhotos(),
        firebaseStore.listSentences(),
        firebaseStore.listResults(),
        firebaseStore.getGameStatus(),
        firebaseStore.countParticipants(),
      ]),
      timeoutMs,
      'Przekroczono czas oczekiwania na odpowiedź Firebase (12 s). Sprawdź połączenie internetowe oraz dane projektu (VITE_FIREBASE_*).'
    )
    const [nickname, entered, photos, sentences, results, game, participants] = data
    cache.nickname = nickname || ''
    cache.entered = !!entered
    cache.photos = photos || []
    cache.sentences = sentences || []
    cache.results = results || []
    cache.game = game || cache.game
    cache.participants = participants || 0
    emit()
    return true
  } catch (e) {
    loadError = e
    emit()
    return false
  }
}

const tmpId = () => 'tmp-' + Math.random().toString(36).slice(2, 10)

export const firebaseBridge = {
  onChange,

  /* -------------------- PROFIL -------------------- */
  getNickname: () => cache.nickname,
  async setNickname(name) {
    cache.nickname = String(name || '').trim().slice(0, 30)
    emit()
    try { await firebaseStore.setNickname(cache.nickname) } catch { /* ignore */ }
  },
  getEntered: () => cache.entered,
  async setEntered() {
    cache.entered = true
    emit()
    try { await firebaseStore.setEntered() } catch { /* ignore */ }
  },
  async registerParticipant() {
    try {
      if (!localStorage.getItem('d10.deviceId')) deviceId() // upewnij się, że deviceId istnieje
      await firebaseStore.registerParticipant()
    } catch { /* ignore */ }
  },
  countParticipants: () => cache.participants,

  /* -------------------- ZDJĘCIA -------------------- */
  listPhotos: () => cache.photos,
  /** Optymistycznie: zdjęcie od razu w cache (z podglądem lokalnym), w tle upload do Firebase. */
  async addPhoto(p) {
    const temp = { id: tmpId(), ...p, at: Date.now() }
    cache.photos = [temp, ...cache.photos]
    emit()
    try {
      const saved = await firebaseStore.addPhoto(p)
      cache.photos = cache.photos.map((x) => (x.id === temp.id ? { ...saved } : x))
      emit()
      return saved
    } catch (e) {
      cache.photos = cache.photos.filter((x) => x.id !== temp.id)
      emit()
      throw e
    }
  },
  async updatePhoto(id, patch) {
    cache.photos = cache.photos.map((p) => (p.id === id ? { ...p, ...patch } : p))
    emit()
    try { await firebaseStore.updatePhoto(id, patch) } catch { /* ignore */ }
  },
  async updatePhotos(ids, patch) {
    const set = new Set(ids)
    cache.photos = cache.photos.map((p) => (set.has(p.id) ? { ...p, ...patch } : p))
    emit()
    try { await firebaseStore.updatePhotos(ids, patch) } catch { /* ignore */ }
  },
  async deletePhoto(id) {
    cache.photos = cache.photos.filter((p) => p.id !== id)
    emit()
    try { await firebaseStore.deletePhoto(id) } catch { /* ignore */ }
  },
  async deletePhotos(ids) {
    const set = new Set(ids)
    cache.photos = cache.photos.filter((p) => !set.has(p.id))
    emit()
    try { await firebaseStore.deletePhotos(ids) } catch { /* ignore */ }
  },

  /* -------------------- ZDANIA -------------------- */
  listSentences: () => cache.sentences,
  async addSentence(s) {
    const temp = { id: tmpId(), ...s, at: Date.now() }
    cache.sentences = [temp, ...cache.sentences]
    emit()
    try {
      const saved = await firebaseStore.addSentence(s)
      cache.sentences = cache.sentences.map((x) => (x.id === temp.id ? { ...saved } : x))
      emit()
      return saved
    } catch (e) {
      cache.sentences = cache.sentences.filter((x) => x.id !== temp.id)
      emit()
      throw e
    }
  },
  async updateSentence(id, patch) {
    cache.sentences = cache.sentences.map((s) => (s.id === id ? { ...s, ...patch } : s))
    emit()
    try { await firebaseStore.updateSentence(id, patch) } catch { /* ignore */ }
  },
  async deleteSentence(id) {
    cache.sentences = cache.sentences.filter((s) => s.id !== id)
    emit()
    try { await firebaseStore.deleteSentence(id) } catch { /* ignore */ }
  },

  /* -------------------- GRA -------------------- */
  getGameStatus: () => cache.game,
  async setGameStatus(patch) {
    cache.game = { ...cache.game, ...patch }
    emit()
    try { await firebaseStore.setGameStatus(patch) } catch { /* ignore */ }
  },

  /* -------------------- WYNIKI -------------------- */
  listResults: () => cache.results,
  async addResult(r) {
    cache.results = [{ id: tmpId(), ...r, at: Date.now() }, ...cache.results]
    emit()
    try { await firebaseStore.addResult(r) } catch { /* ignore */ }
  },
  async clearResults() {
    /* w produkcji bez kasowania wyników z poziomu klienta */
  },
  async resetAll() {
    /* bez kasowania danych z klienta */
  },
}
