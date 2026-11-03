/** A session-expired listener is installed by main.ts so http.ts stays router-free. */
type Listener = () => void

let listener: Listener | null = null

export function onSessionExpired(next: Listener) {
  listener = next
}

export function emitSessionExpired() {
  listener?.()
}
