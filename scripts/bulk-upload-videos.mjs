#!/usr/bin/env node
/**
 * 🎬 MASOWY IMPORT FILMÓW Z KOMPRESJĄ (bulk upload wideo)
 * ========================================================
 * Kompresuje filmy (ffmpeg: H.264 + AAC, skala ≤1280 px, CRF 27 — ~5–10× mniejsze),
 * wycina miniaturkę (poster), wgrywa do Firebase Storage i tworzy dokumenty
 * w Firestore (type:'video') — od razu widoczne w galerii.
 *
 * JAK UŻYĆ (szczegóły w README → „🎬 Filmy w galerii"):
 *   1) folder z filmami, np. ./filmy-bulk/
 *   2) plik films-manifest.csv (kolumny: filename,caption,year,folder,author)
 *   3) service-account.json (jak przy zdjęciach — patrz „Masowy upload zdjęć")
 *   4) node scripts/bulk-upload-videos.mjs --videos ./filmy-bulk \
 *         --manifest films-manifest.csv --service-account service-account.json
 *
 * OPCJE: --dry-run (plan bez wysyłki), --limit N, --scale 1280, --crf 27,
 *        --quality-audio 128k, --bucket NAZWA
 *
 * IDEMPOTENTNY: identyfikator dokumentu = nazwa pliku (slug) — ponowne
 * uruchomienie pomija już zaimportowane filmy.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'
import admin from 'firebase-admin'
import ffmpegPath from 'ffmpeg-static'

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
const VID_DIR = args.videos || './filmy-bulk'
const MANIFEST = args.manifest || './films-manifest.csv'
const SA_FILE = args['service-account'] || './service-account.json'
const DRY = args['dry-run'] === 'true' || args['dry-run'] === '1'
const LIMIT = args.limit ? Number(args.limit) : Infinity
const SCALE = Number(args.scale || 1280)     // max szerokość po kompresji
const CRF = Number(args.crf || 27)           // jakość (niżej = lepiej, większy plik)
const AQ = args['quality-audio'] || '128k'

const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv']
const fail = (msg) => { console.error('❌ ' + msg); process.exit(1) }
if (!ffmpegPath) fail('Brak ffmpeg-static — uruchom: npm i -D ffmpeg-static')

/* ---------------------------- manifest ---------------------------- */
if (!existsSync(MANIFEST)) fail(`Nie znaleziono manifestu: ${MANIFEST} (kolumny: filename,caption,year,folder,author)`)
const rows = readFileSync(MANIFEST, 'utf8').split('\n').filter(Boolean).map((l) => l.trim())
const delim = rows[0].includes(';') ? ';' : ','
const header = rows[0].split(delim).map((h) => h.trim().toLowerCase())
if (!header.includes('filename')) fail('Manifest musi mieć kolumnę „filename"')
const manifest = new Map()
for (const r of rows.slice(1)) {
  const cols = r.split(delim)
  const o = {}
  header.forEach((h, i) => { o[h] = (cols[i] || '').trim() })
  if (o.filename) manifest.set(o.filename.toLowerCase(), o)
}
console.log(`✅ Manifest: ${manifest.size} opisanych filmów`)

if (!existsSync(VID_DIR)) fail(`Nie znaleziono folderu z filmami: ${VID_DIR}`)
const files = readdirSync(VID_DIR).filter((f) => VIDEO_EXT.includes(extname(f).toLowerCase())).sort()
console.log(`✅ Znaleziono ${files.length} filmów w ${VID_DIR}\n`)

const found = files.filter((f) => manifest.has(f.toLowerCase()))
if (!found.length) fail('Żadnego filmu nie ma w manifeście (filename = nazwa pliku).')
const noManifest = files.filter((f) => !manifest.has(f.toLowerCase()))
if (noManifest.length) console.warn(`⚠️  Pomijam ${noManifest.length} filmów bez opisu: ${noManifest.slice(0, 5).join(', ')}${noManifest.length > 5 ? '…' : ''}\n`)

/* ---------------------------- Firebase ---------------------------- */
let db, bucket, bucketName
if (!DRY) {
  if (!existsSync(SA_FILE)) fail(`Brak klucza serwisowego: ${SA_FILE} (patrz „Masowy upload zdjęć" w README)`)
  const sa = JSON.parse(readFileSync(SA_FILE, 'utf8'))
  bucketName = args.bucket || `${sa.project_id}.appspot.com`
  admin.initializeApp({ credential: admin.credential.cert(sa), storageBucket: bucketName })
  db = admin.firestore()
  bucket = admin.storage().bucket()
  console.log(`✅ Połączono z Firebase (${bucketName})`)
}
const publicUrl = (p) => `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(p)}?alt=media`
const slug = (name) => String(name).replace(extname(name), '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'film'

/* ---------------------------- import ---------------------------- */
let ok = 0, skipped = 0, failed = 0, savedMb = 0
const startedAt = Date.now()
const tmpOut = join(tmpdir(), 'd10-vid-' + Date.now())
const tmpPoster = join(tmpdir(), 'd10-poster-' + Date.now() + '.jpg')

for (const f of found.slice(0, LIMIT)) {
  const meta = manifest.get(f.toLowerCase())
  const docId = slug(f)
  const folder = meta.folder || 'X-lecie PeKaeS'
  const srcPath = join(VID_DIR, f)

  if (!DRY) {
    const existing = await db.doc(`zdjecia/${docId}`).get().catch(() => null)
    if (existing && existing.exists) { console.log(`⏭  pomijam (już jest): ${f}`); skipped++; continue }
  }

  const origMb = statSync(srcPath).size / 1024 / 1024
  try {
    const outPath = tmpOut + '.mp4'
    // kompresja: h264+aac, skala ≤ SCALE, CRF
    execFileSync(ffmpegPath, [
      '-y', '-i', srcPath,
      '-vf', `scale='min(${SCALE},iw)':-2`,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(CRF),
      '-c:a', 'aac', '-b:a', AQ, '-movflags', '+faststart',
      outPath,
    ], { stdio: 'ignore' })
    const compMb = statSync(outPath).size / 1024 / 1024
    savedMb += Math.max(0, origMb - compMb)

    // miniaturka (poster) — klatka ~1 s
    execFileSync(ffmpegPath, ['-y', '-i', srcPath, '-ss', '1', '-vframes', '1', '-vf', 'scale=640:-2', '-q:v', '3', tmpPoster], { stdio: 'ignore' })

    if (DRY) {
      console.log(`[dry-run] ${f}`)
      console.log(`   podpis: „${meta.caption || '—'}" • rok: ${meta.year || '—'} • folder: ${folder}`)
      console.log(`   rozmiar: ${origMb.toFixed(1)} MB → ${compMb.toFixed(1)} MB (oszczędzono ${(origMb - compMb).toFixed(1)} MB)`)
      rmSync(outPath, { force: true })
      continue
    }

    await bucket.file(`filmy/${folder}/${docId}.mp4`).save(require('node:fs').readFileSync(outPath), { contentType: 'video/mp4', metadata: { cacheControl: 'public, max-age=31536000, immutable' } })
    await bucket.file(`zdjecia/${folder}/${docId}-poster.jpg`).save(require('node:fs').readFileSync(tmpPoster), { contentType: 'image/jpeg' })
    await db.doc(`zdjecia/${docId}`).set({
      author: meta.author || 'Archiwum klubu',
      caption: meta.caption || '',
      year: meta.year || '',
      folder,
      type: 'video',
      src: publicUrl(`filmy/${folder}/${docId}.mp4`),
      poster: publicUrl(`zdjecia/${folder}/${docId}-poster.jpg`),
      thumb: publicUrl(`zdjecia/${folder}/${docId}-poster.jpg`),
      at: admin.firestore.FieldValue.serverTimestamp(),
    })
    ok++
    console.log(`✅ ${f} → folder „${folder}" (${origMb.toFixed(1)} MB → ${compMb.toFixed(1)} MB)`)
    rmSync(outPath, { force: true })
  } catch (e) {
    failed++
    console.error(`❌ BŁĄD dla ${f}: ${(e.message || e).slice(0, 140)}`)
  }
}
try { rmSync(tmpOut + '.mp4', { force: true }); rmSync(tmpPoster, { force: true }) } catch { /* ignore */ }

console.log('\n' + '='.repeat(56))
if (DRY) {
  console.log(`DRY-RUN: ${found.slice(0, LIMIT).length} filmów gotowych. Oszczędność: ${(savedMb).toFixed(1)} MB.`)
  console.log('Uruchom bez --dry-run, aby wgrać do Firebase.')
} else {
  console.log(`Import zakończony (${((Date.now() - startedAt) / 1000).toFixed(0)} s): wgrano ${ok}, pominięto ${skipped}, błędy ${failed}.`)
  console.log(`Oszczędność dzięki kompresji: ${(savedMb).toFixed(1)} MB.`)
}
