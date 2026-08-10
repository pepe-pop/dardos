/**
 * Generowanie kodu QR dla aplikacji.
 * Użycie:
 *   npm run qr -- "https://twoj-nick.github.io/darts10/"  [ścieżka-pliku]
 * Wymaga: npm i (zainstaluje pakiet qrcode)
 */
import QRCode from 'qrcode'

const url = process.argv[2] || 'https://twoj-nick.github.io/darts10/'
const out = process.argv[3] || 'qr-zjazd.png'

if (!/^https?:\/\//.test(url)) {
  console.error('⚠️  URL musi zaczynać się od http(s)://')
  process.exit(1)
}

await QRCode.toFile(out, url, {
  width: 1024,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: '#0a0e15', light: '#ffffff' },
})

console.log(`✅ Kod QR zapisany: ${out}`)
console.log(`   Kieruje na: ${url}`)
console.log('   Wydrukuj go w dobrej rozdzielczości (np. A5+) i rozwieś na zjeździe.')
