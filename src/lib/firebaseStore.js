/**
 * Tryb PRODUKCYJNY: Firebase (Firestore + Storage).
 *
 * Jak włączyć (szczegóły w KONCEPCJA.md, rozdz. „Wdrożenie"):
 *   1) npm i firebase
 *   2) wypełnij src/firebase-config.js danymi ze swojego projektu,
 *   3) wgraj reguły: firebase/firestore.rules i firebase/storage.rules,
 *   4) ustaw FEATURES.storageMode = 'firebase' w src/config.js.
 *
 * API tego modułu jest identyczne z localStore — reszta aplikacji nie wie,
 * gdzie siedzą dane (pattern „adapter").
 *
 * MODEL ZDJĘĆ: bez moderacji. Zdjęcie ma pole `folder` (domyślnie folder
 * jubileuszowy); przenoszenie/usuwanie/zmiana roku — tylko admin (reguły).
 */

let app, db, storage
let ready = false

async function ensure() {
  if (ready) return
  const cfg = (await import('../firebase-config.js')).default
  if (!cfg || !cfg.apiKey || cfg.apiKey === 'PLACEHOLDER' || cfg.apiKey.startsWith('TU-WKLEJ')) {
    throw new Error('Brak konfiguracji Firebase — wypełnij .env (VITE_FIREBASE_*) i ustaw storageMode=firebase')
  }
  const fb = await import('firebase/app')
  const fs = await import('firebase/firestore')
  const st = await import('firebase/storage')
  app = fb.initializeApp(cfg)
  db = fs.getFirestore(app)
  storage = st.getStorage(app)
  ready = true
}

/** Upload pliku do Storage, zwraca publiczny URL. */
async function uploadFile(blob, path) {
  await ensure()
  const st = await import('firebase/storage')
  const ref = st.ref(storage, path)
  const snap = await st.uploadBytes(ref, blob, { contentType: 'image/jpeg' })
  return st.getDownloadURL(snap.ref)
}

export const firebaseStore = {
  async getNickname() {
    return localStorage.getItem('d10.nickname') || ''
  },
  async setNickname(name) {
    const n = String(name || '').trim().slice(0, 30)
    if (n) localStorage.setItem('d10.nickname', n)
    return n
  },

  async getEntered() {
    try { return localStorage.getItem('d10.entered') === '1' } catch { return false }
  },
  async setEntered() {
    try { localStorage.setItem('d10.entered', '1') } catch { /* ignore */ }
  },

  async registerParticipant() {
    await ensure()
    const fs = await import('firebase/firestore')
    const deviceId = localStorage.getItem('d10.deviceId')
    await fs.setDoc(fs.doc(db, 'uczestnicy', deviceId || 'gość'), {
      name: (await this.getNickname()) || 'Gość',
      at: fs.serverTimestamp(),
    }, { merge: true })
  },
  async countParticipants() {
    await ensure()
    const fs = await import('firebase/firestore')
    const snap = await fs.getDoc(fs.doc(db, 'ustawienia', 'liczniki'))
    return snap.exists() ? (snap.data().uczestnicy || 0) : 0
  },

  /* -------------------- ZDJĘCIA -------------------- */
  async listPhotos() {
    await ensure()
    const fs = await import('firebase/firestore')
    const q = fs.query(fs.collection(db, 'zdjecia'), fs.orderBy('at', 'desc'), fs.limit(500))
    const snap = await fs.getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async addPhoto({ author, caption, year, folder, dataUrl, thumbDataUrl }) {
    await ensure()
    const fs = await import('firebase/firestore')
    const id = fs.doc(fs.collection(db, 'zdjecia')).id
    const base = `zdjecia/${folder}`
    const fullUrl = await uploadFile(dataUrlToBlob(dataUrl), `${base}/${id}.jpg`)
    const thumbUrl = thumbDataUrl ? await uploadFile(dataUrlToBlob(thumbDataUrl), `${base}/${id}-thumb.jpg`) : fullUrl
    const doc = { author, caption, year, folder, status: 'approved', src: fullUrl, thumb: thumbUrl, at: fs.serverTimestamp() }
    await fs.setDoc(fs.doc(db, 'zdjecia', id), doc)
    return { id, ...doc }
  },
  async updatePhoto(id, patch) {
    await ensure()
    const fs = await import('firebase/firestore')
    await fs.updateDoc(fs.doc(db, 'zdjecia', id), { ...patch, moderatedAt: fs.serverTimestamp() })
  },
  async updatePhotos(ids, patch) {
    const fs = await import('firebase/firestore')
    await Promise.all(ids.map((id) => this.updatePhoto(id, patch).catch(() => {})))
  },
  async deletePhoto(id) {
    await ensure()
    const fs = await import('firebase/firestore')
    await fs.deleteDoc(fs.doc(db, 'zdjecia', id))
  },
  async deletePhotos(ids) {
    await Promise.all(ids.map((id) => this.deletePhoto(id).catch(() => {})))
  },

  /* -------------------- ZDANIA -------------------- */
  async listSentences() {
    await ensure()
    const fs = await import('firebase/firestore')
    const q = fs.query(fs.collection(db, 'zdania'), fs.orderBy('at', 'desc'), fs.limit(500))
    const snap = await fs.getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async addSentence({ author, text }) {
    await ensure()
    const fs = await import('firebase/firestore')
    const doc = { author, text, deviceId: localStorage.getItem('d10.deviceId'), status: 'pending', at: fs.serverTimestamp() }
    const ref = await fs.addDoc(fs.collection(db, 'zdania'), doc)
    return { id: ref.id, ...doc }
  },
  async updateSentence(id, patch) {
    await ensure()
    const fs = await import('firebase/firestore')
    await fs.updateDoc(fs.doc(db, 'zdania', id), { ...patch, moderatedAt: fs.serverTimestamp() })
  },
  async deleteSentence(id) {
    await ensure()
    const fs = await import('firebase/firestore')
    await fs.deleteDoc(fs.doc(db, 'zdania', id))
  },

  async getGameStatus() {
    await ensure()
    const fs = await import('firebase/firestore')
    const snap = await fs.getDoc(fs.doc(db, 'ustawienia', 'gra'))
    if (!snap.exists()) return { status: 'collect', minSentences: 6 }
    return snap.data()
  },
  async setGameStatus(patch) {
    await ensure()
    const fs = await import('firebase/firestore')
    await fs.setDoc(fs.doc(db, 'ustawienia', 'gra'), patch, { merge: true })
  },

  /* -------------------- WYNIKI -------------------- */
  async listResults() {
    await ensure()
    const fs = await import('firebase/firestore')
    const q = fs.query(fs.collection(db, 'wyniki'), fs.orderBy('at', 'desc'), fs.limit(500))
    const snap = await fs.getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async addResult({ game, author, score, max, timeMs }) {
    await ensure()
    const fs = await import('firebase/firestore')
    await fs.addDoc(fs.collection(db, 'wyniki'), {
      game, author, score, max, timeMs, at: fs.serverTimestamp(),
    })
  },
  async clearResults() {
    /* Celowo brak — w produkcji nie kasujemy wyników z poziomu klienta. */
  },

  async resetAll() {
    /* Celowo brak — w produkcji danych nie kasujemy z poziomu klienta. */
  },
  onChange() {
    /* Brak subskrypcji czasu rzeczywistego w tym MVP — strony odświeżają dane przy wejściu. */
  },
}

function dataUrlToBlob(dataUrl) {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/data:(.*?);/)?.[1] || 'image/jpeg'
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
