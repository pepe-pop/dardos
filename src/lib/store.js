/**
 * Jednolity interfejs dostępu do danych + helpery rekordów.
 * FEATURES.storageMode decyduje:
 *   'local'    — localStorage (demo, offline) — 100% synchroniczny,
 *   'firebase' — Firebase przez MOST firebaseBridge (cache + sync UI),
 *                patrz firebaseBridge.js — bez niego tryb firebase wywalał UI.
 */
import { FEATURES, CLUB } from '../config.js'
import { localStore } from './localStore.js'
import { firebaseBridge, loadAll, getLoadError } from './firebaseBridge.js'
import { useEffect, useState } from 'react'

export const isFirebase = FEATURES.storageMode === 'firebase'

/** Jednolity interfejs: sync odczyty + async zapisy (localStore lub firebaseBridge). */
export const store = isFirebase ? firebaseBridge : localStore

export { loadAll, getLoadError }

/** Najlepszy wynik w danej grze (better: 'high' = więcej znaczy lepiej, 'low' = mniej). */
export async function bestFor(game, better = 'high') {
  try {
    const results = await implListResults()
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
    await store.addResult({ game, author, score, max, timeMs })
  } catch { /* w trybie offline zapis może się nie udać — nie blokujemy gry */ }
  const isRecord = prevBest === null || (better === 'low' ? score < prevBest : score > prevBest)
  return { isRecord, prevBest }
}

// listResults może być sync (cache) — ujednolicamy przez Promise.resolve
async function implListResults() {
  const r = store.listResults ? store.listResults() : []
  return r && typeof r.then === 'function' ? await r : r
}

/** Unikalne foldery zdjęć (folder jubileuszowy zawsze pierwszy, reszta malejąco). */
export function photoFolders(photos) {
  const set = new Set((photos || []).map((p) => p.folder).filter(Boolean))
  const rest = [...set].filter((f) => f !== CLUB.jubileeFolder).sort((a, b) => b.localeCompare(a))
  return [CLUB.jubileeFolder, ...rest]
}

/**
 * Hook: re-render komponentu przy każdej zmianie danych w store.
 * (localStore i firebaseBridge emitują zmiany przez onChange.)
 */
export function useStoreVersion() {
  const [, setV] = useState(0)
  useEffect(() => {
    const un = store.onChange ? store.onChange(() => setV((v) => v + 1)) : undefined
    return () => un && un()
  }, [])
  return store
}
