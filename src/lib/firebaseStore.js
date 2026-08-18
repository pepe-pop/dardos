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
async function uploadFile(blob, path, contentType) {
  await ensure()
  const st = await import('firebase/storage')
  const ref = st.ref(storage, path)
  const snap = await st.uploadBytes(ref, blob, { contentType: contentType || 'image/jpeg' })
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
    try {
      // Liczymy faktyczne dokumenty uczestników (1 dokument na urządzenie, id = deviceId).
      // Na Spark nie ma taniego count() — getDocs + size (1 odczyt na dokument, limit 1000
      // wystarczy na każdy zjazd; odświeżanie co 30 s = kilka tys. odczytów/dzień — bezpiecznie).
      const q = fs.query(fs.collection(db, 'uczestnicy'), fs.limit(1000))
      const snap = await fs.getDocs(q)
      return snap.size
    } catch (e) {
      // Fallback: licznik ręczny (gdyby był ustawiony w ustawienia/liczniki)
      const snap = await fs.getDoc(fs.doc(db, 'ustawienia', 'liczniki'))
      return snap.exists() ? (snap.data().uczestnicy || 0) : 0
    }
  },

  /* -------------------- ZDJĘCIA -------------------- */
  async listPhotos() {
    await ensure()
    const fs = await import('firebase/firestore')
    const q = fs.query(fs.collection(db, 'zdjecia'), fs.orderBy('at', 'desc'), fs.limit(500))
    const snap = await fs.getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async addPhoto({ author, caption, year, folder, dataUrl, thumbDataUrl, type = 'image', poster = '', videoBlob }) {
    await ensure()
    const fs = await import('firebase/firestore')
    const id = fs.doc(fs.collection(db, 'zdjecia')).id
    // Uwaga: ZGODNOŚĆ z regułami! firestore.rules → match /zdjecia:
    // create pozwala na DOKŁADNIE pola: author, caption, year, folder, src, thumb, poster, type, at.
    // Nie dodawaj tu innych pól (np. status) — inaczej zapis dostanie
    // "missing or insufficient permissions" (błąd: plik w Storage, ale nie w galerii).
    const doc = {
      author, caption, year, folder,
      type, // 'image' | 'video'
      at: fs.serverTimestamp(),
    }
    if (type === 'video') {
      // Film: upload wideo do /filmy/{folder}/{id}.mp4, poster (miniaturka) do /zdjecia/{folder}/{id}-poster.jpg
      const fullUrl = videoBlob
        ? await uploadFile(videoBlob, `filmy/${folder}/${id}.mp4`, 'video/mp4')
        : dataUrl // tryb "z linku" — src = podany URL
      const posterUrl = poster
        ? await uploadFile(dataUrlToBlob(poster), `zdjecia/${folder}/${id}-poster.jpg`)
        : ''
      doc.src = fullUrl
      doc.poster = posterUrl
      doc.thumb = posterUrl || ''
    } else {
      const fullUrl = await uploadFile(dataUrlToBlob(dataUrl), `zdjecia/${folder}/${id}.jpg`)
      const thumbUrl = thumbDataUrl ? await uploadFile(dataUrlToBlob(thumbDataUrl), `zdjecia/${folder}/${id}-thumb.jpg`) : fullUrl
      doc.src = fullUrl
      doc.thumb = thumbUrl
      doc.poster = ''
    }
    await fs.setDoc(fs.doc(db, 'zdjecia', id), doc)
    return { id, ...doc }
  },
  async updatePhoto(id, patch) {
    await ensure()
    const fs = await import('firebase/firestore')
    // Uwaga: NIE dodawaj tu dodatkowych pól (np. moderatedAt) — reguły firestore.rules
    // dla update pozwalają zmieniać TYLKO: year, folder, caption, author.
    // Wcześniej moderatedAt blokowało zapis → "przeniesienie" nie dochodziło do Firebase.
    await fs.updateDoc(fs.doc(db, 'zdjecia', id), patch)
  },
  async updatePhotos(ids, patch) {
    const fs = await import('firebase/firestore')
    await Promise.all(ids.map((id) => this.updatePhoto(id, patch).catch((e) => console.warn('updatePhotos', id, e.message))))
  },
  async deletePhoto(id) {
    await ensure()
    const fs = await import('firebase/firestore')
    await fs.deleteDoc(fs.doc(db, 'zdjecia', id))
  },
  async deletePhotos(ids) {
    await Promise.all(ids.map((id) => this.deletePhoto(id).catch((e) => console.warn('deletePhotos', id, e.message))))
  },

  /* -------------------- ZDANIA -------------------- */
  async listSentences() {
    await ensure()
    const fs = await import('firebase/firestore')
    const q = fs.query(fs.collection(db, 'zdania'), fs.orderBy('at', 'desc'), fs.limit(500))
    const snap = await fs.getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
  async addSentence({ author, text, round }) {
    await ensure()
    const fs = await import('firebase/firestore')
    // Pola zgodne z firestore.rules (create): author, text, deviceId, round, status, at
    const doc = {
      author,
      text,
      deviceId: localStorage.getItem('d10.deviceId'),
      round: round || 1,
      status: 'pending',
      at: fs.serverTimestamp(),
    }
    const ref = await fs.addDoc(fs.collection(db, 'zdania'), doc)
    return { id: ref.id, ...doc }
  },
  async updateSentence(id, patch) {
    await ensure()
    const fs = await import('firebase/firestore')
    // Reguły pozwalają zmieniać TYLKO pole status (bez moderatedAt!).
    await fs.updateDoc(fs.doc(db, 'zdania', id), patch)
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

  /* -------------------- USTAWIENIA (film na start) -------------------- */
  async getSettings() {
    await ensure()
    const fs = await import('firebase/firestore')
    const snap = await fs.getDoc(fs.doc(db, 'ustawienia', 'ustawienia'))
    return snap.exists() ? snap.data() : {}
  },
  async setSettings(patch) {
    await ensure()
    const fs = await import('firebase/firestore')
    await fs.setDoc(fs.doc(db, 'ustawienia', 'ustawienia'), patch, { merge: true })
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
