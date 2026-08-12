#!/usr/bin/env node
/**
 * 📤 MASOWY IMPORT ZDJĘĆ DO FIREBASE (bulk upload)
 * =================================================
 * Wgrywa do Firebase opisane zdjęcia (podpis, rok, kategoria), kompresując je
 * tak samo jak aplikacja (max 1600 px, JPEG ~0.75 + miniaturka 520 px).
 *
 * JAK UŻYĆ (szczegóły w README → „📤 Masowy upload zdjęć"):
 *   1) Przygotuj folder ze zdjęciami, np. ./zdjecia-bulk/
 *   2) Przygotuj plik photos-manifest.csv (kolumny: filename,caption,year,folder,author)
 *   3) Wygeneruj klucz serwisowy w konsoli Firebase (Ustawienia → Konta usługowe →
 *      „Generuj nowy klucz prywatny") i zapisz jako service-account.json (gitignored!)
 *   4) npm i -D sharp firebase-admin   (już w package.json)
 *   5) node scripts/bulk-upload.mjs --images ./zdjecia-bulk --manifest photos-manifest.csv \
 *         --service-account service-account.json
 *
 * OPCJE:
 *   --dry-run            tylko kompresja + plan (bez wysyłki do Firebase)
 *   --limit N            wgraj tylko N pierwszych zdjęć (test)
 *   --bucket NAZWA       nadpisze domyślny bucket (project_id.appspot.com)
 *   --max-width 1600     szerokość zdjęcia (domyślnie jak aplikacja)
 *   --quality 0.75       jakość JPEG (domyślnie jak aplikacja)
 *
 * SKRYPT JEST IDEMPOTENTNY: identyfikator dokumentu = nazwa pliku (slug),
 * więc ponowne uruchomienie NIE tworzy duplikatów (pomija istniejące).
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import sharp from 'sharp'
import admin from 'firebase-admin'

/* ---------------------------- argumenty ---------------------------- */
const args = {}
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i]
  if (a.startsWith('--')) {
    const key = a.slice(2)
    const val = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : 'true'
    args[key] = val
    if (val !== 'true') i++
  }
}

const IMG_DIR = args.images || './zdjecia-bulk'
const MANIFEST = args.manifest || './photos-manifest.csv'
const SA_FILE = args['service-account'] || './service-account.json'
const DRY = args['dry-run'] === 'true' || args['dry-run'] === '1'
const LIMIT = args.limit ? Number(args.limit) : Infinity
const MAX_WIDTH = Number(args['max-width'] || 1600)
const QUALITY = Number(args.quality || 0.75)
const THUMB_WIDTH = 520
const THUMB_QUALITY = 0.7

const IMG_EXT = ['.jpg', '.jpeg', '.png', '.webp']

/* ---------------------------- narzędzia ---------------------------- */
/** Parsuje CSV z nagłówkami; obsługuje separator ; (polski Excel) oraz przecinek. */
function parseCSV(text) {
  const delim = text.split('\n')[0].includes(';') ? ';' : ','
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false
      } else field += c
    } else {
      if (c === '"') inQ = true
      else if (c === delim) { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''))
}

function slug(name) {
  return String(name)
    .replace(extname(name), '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // usuń polskie znaki
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'zdjecie'
}

const fail = (msg) => { console.error('❌ ' + msg); process.exit(1) }

/* ---------------------------- manifest ---------------------------- */
if (!existsSync(MANIFEST)) fail(`Nie znaleziono pliku manifestu: ${MANIFEST}\n   Utwórz go (kolumny: filename,caption,year,folder,author) — szablon: scripts/manifest.example.csv`)
const manifest = new Map()
const rows = parseCSV(readFileSync(MANIFEST, 'utf8'))
const header = rows[0].map((h) => h.trim().toLowerCase())
const reqCols = ['filename']
for (const h of reqCols) if (!header.includes(h)) fail(`Manifest musi zawierać kolumnę „${h}". Znaleziono: ${header.join(', ')}`)
for (const r of rows.slice(1)) {
  const o = {}
  header.forEach((h, i) => { o[h] = (r[i] || '').trim() })
  if (o.filename) manifest.set(o.filename.toLowerCase(), o)
}
console.log(`✅ Manifest: ${manifest.size} opisanych zdjęć (${basename(MANIFEST)})`)

/* ---------------------------- zdjęcia ---------------------------- */
if (!existsSync(IMG_DIR)) fail(`Nie znaleziono folderu ze zdjęciami: ${IMG_DIR}`)
const files = readdirSync(IMG_DIR)
  .filter((f) => IMG_EXT.includes(extname(f).toLowerCase()))
  .sort()
console.log(`✅ Znaleziono ${files.length} plików graficznych w ${IMG_DIR}\n`)

const found = files.filter((f) => manifest.has(f.toLowerCase()))
if (found.length === 0) {
  fail(`Żadne zdjęcie nie ma wpisu w manifeście. Kolumny: filename musi odpowiadać NAZWIE PLIKU (np. 2015-01.jpg)`)
}
const noManifest = files.filter((f) => !manifest.has(f.toLowerCase()))
if (noManifest.length) console.warn(`⚠️  Pomijam ${noManifest.length} plików bez opisu w manifeście:\n    ${noManifest.slice(0, 6).join(', ')}${noManifest.length > 6 ? '…' : ''}\n`)

/* ---------------------------- Firebase ---------------------------- */
let db, bucket, bucketName
if (!DRY) {
  if (!existsSync(SA_FILE)) fail(`Nie znaleziono klucza serwisowego: ${SA_FILE}\n   Wygeneruj go w konsoli Firebase (Ustawienia projektu → Konta usługowe → „Generuj nowy klucz prywatny") i zapisz jako service-account.json`)
  try {
    const sa = JSON.parse(readFileSync(SA_FILE, 'utf8'))
    const projectId = sa.project_id
    bucketName = args.bucket || `${projectId}.appspot.com`
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      storageBucket: bucketName,
    })
    db = admin.firestore()
    bucket = admin.storage().bucket()
    console.log(`✅ Połączono z Firebase (projekt: ${projectId}, bucket: ${bucketName})`)
  } catch (e) {
    fail('Błąd inicjalizacji Firebase: ' + (e.message || e))
  }
}

/** Publiczny URL pliku w Storage (reguły zezwalają na publiczny odczyt). */
function publicUrl(fullPath) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fullPath)}?alt=media`
}

/* ---------------------------- import ---------------------------- */
let ok = 0, skipped = 0, failed = 0, savedKb = 0
const startedAt = Date.now()

for (const f of found.slice(0, LIMIT)) {
  const meta = manifest.get(f.toLowerCase())
  const docId = slug(f)
  const folder = meta.folder || 'Archiwum'
  const year = meta.year || ''

  if (!DRY) {
    const existing = await db.doc(`zdjecia/${docId}`).get().catch(() => null)
    if (existing && existing.exists) {
      console.log(`⏭  pomijam (już jest): ${f}`)
      skipped++
      continue
    }
  }

  const srcPath = join(IMG_DIR, f)
  const origSize = statSync(srcPath).size

  try {
    // kompresja — tak jak w aplikacji (src/lib/image.js)
    const pipeline = sharp(srcPath).rotate().flatten({ background: '#fff' })
    const full = await pipeline.clone().resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: Math.round(QUALITY * 100) }).toBuffer()
    const thumb = await pipeline.clone().resize({ width: THUMB_WIDTH, height: THUMB_WIDTH, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: Math.round(THUMB_QUALITY * 100) }).toBuffer()

    const fullPath = `zdjecia/${folder}/${docId}.jpg`
    const thumbPath = `zdjecia/${folder}/${docId}-thumb.jpg`
    const savedKbThis = (origSize - full.length) / 1024
    savedKb += savedKbThis

    if (DRY) {
      console.log(`[dry-run] ${f} → ${docId}`)
      console.log(`   podpis: „${meta.caption || '—'}" • rok: ${year || '—'} • folder: ${folder}`)
      console.log(`   rozmiar: ${(origSize / 1024).toFixed(0)} KB → ${(full.length / 1024).toFixed(0)} KB (oszczędzono ${savedKbThis.toFixed(0)} KB)`)
      continue
    }

    // upload skompresowanych plików bezpośrednio do Storage
    await bucket.file(fullPath).save(full, { contentType: 'image/jpeg', metadata: { cacheControl: 'public, max-age=31536000, immutable' } })
    await bucket.file(thumbPath).save(thumb, { contentType: 'image/jpeg', metadata: { cacheControl: 'public, max-age=31536000, immutable' } })

    // dokument w Firestore — pola zgodne z firestore.rules (create)
    await db.doc(`zdjecia/${docId}`).set({
      author: meta.author || 'Archiwum klubu',
      caption: meta.caption || '',
      year,
      folder,
      src: publicUrl(fullPath),
      thumb: publicUrl(thumbPath),
      at: admin.firestore.FieldValue.serverTimestamp(),
    })
    ok++
    console.log(`✅ ${f} → folder „${folder}" (${(full.length / 1024).toFixed(0)} KB)` + (year ? `, rok ${year}` : ''))
  } catch (e) {
    failed++
    console.error(`❌ BŁĄD dla ${f}: ${(e.message || e).slice(0, 140)}`)
  }
}

/* ---------------------------- podsumowanie ---------------------------- */
console.log('\n' + '='.repeat(56))
if (DRY) {
  console.log(`DRY-RUN zakończony: ${found.slice(0, LIMIT).length} zdjęć gotowych do importu.`)
  console.log(`Łączna oszczędność miejsca: ${(savedKb / 1024).toFixed(1)} MB (kompresja).`)
  console.log('Uruchom bez --dry-run, aby wgrać do Firebase.')
} else {
  console.log(`Import zakończony (${((Date.now() - startedAt) / 1000).toFixed(1)} s):`)
  console.log(`   wgrano: ${ok} • pominięto (już było): ${skipped} • błędy: ${failed}`)
  console.log(`   oszczędność miejsca dzięki kompresji: ${(savedKb / 1024).toFixed(1)} MB`)
  console.log('\nZdjęcia są teraz w galerii aplikacji (folder: jak w manifeście).')
  console.log('Odśwież aplikację, żeby je zobaczyć.')
}
