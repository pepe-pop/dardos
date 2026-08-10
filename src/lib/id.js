/** Losowy identyfikator (unikalny w praktyce dla pojedynczego urządzenia). */
export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** Stały identyfikator urządzenia (przetrwa odświeżenie, nie przetrwa czyszczenia localStorage).
 *  Bezpieczny nawet, gdy localStorage jest zablokowany. */
export function deviceId() {
  try {
    let id = localStorage.getItem('d10.deviceId')
    if (!id) {
      id = uid() + uid()
      localStorage.setItem('d10.deviceId', id)
    }
    return id
  } catch {
    return 'mem-' + uid() + uid()
  }
}
