/**
 * Jednolity interfejs dostępu do danych + helpery rekordów.
 * FEATURES.storageMode decyduje: 'local' (demo, localStorage) | 'firebase' (produkcja).
 */
import { FEATURES, CLUB } from '../config.js'
import { localStore } from './localStore.js'
import { firebaseStore } from './firebaseStore.js'
import { useEffect, useState } from 'react'

const impl = FEATURES.storageMode === 'firebase' ? firebaseStore : localStore

export const store = impl

/** Najlepszy wynik w danej grze (better: 'high' = więcej znaczy lepiej, 'low' = mniej). */
export async function bestFor(game, better = 'high') {
  try {
    const results = await impl.listResults()
    const list = (results || []).filter((r) => r.game === game)
    if (!list.length) return null
    const values = list.map((r) => Number(r.score) || 0)
    return better === 'low' ? Math.min(...values) : Math.max(...values)
  } catch {
    return null
  }
}

/**
 * Zapis wyniku do rankingu + sprawdzenie, czy to nowy rekord.
 * Zwraca { isRecord, prevBest }.
 */
export async function recordGame({ game, author, score, max = null, timeMs = 0, better = 'high' }) {
  const prevBest = await bestFor(game, better)
  try {
    await impl.addResult({ game, author, score, max, timeMs })
  } catch { /* w trybie offline zapis może się nie udać — nie blokujemy gry */ }
  const isRecord = prevBest === null || (better === 'low' ? score < prevBest : score > prevBest)
  return { isRecord, prevBest }
}

/** Unikalne foldery zdjęć (folder jubileuszowy zawsze pierwszy, reszta malejąco). */
export function photoFolders(photos) {
  const set = new Set((photos || []).map((p) => p.folder).filter(Boolean))
  const rest = [...set].filter((f) => f !== CLUB.jubileeFolder).sort((a, b) => b.localeCompare(a))
  return [CLUB.jubileeFolder, ...rest]
}

/**
 * Hook: re-render komponentu przy każdej zmianie danych w store.
 * (W trybie local — subskrypcja; w trybie firebase — brak realtime w MVP, patrz docs.)
 */
export function useStoreVersion() {
  const [, setV] = useState(0)
  useEffect(() => {
    const un = store.onChange ? store.onChange(() => setV((v) => v + 1)) : undefined
    return () => un && un()
  }, [])
  return store
}
