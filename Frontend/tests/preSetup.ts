// This file is listed BEFORE setup.ts in vite.config.ts setupFiles so that
// localStorage is properly defined before any store modules are imported.
//
// Node.js 25 ships a built-in `localStorage` that is missing standard methods
// (setItem, clear, removeItem, …) unless the --localstorage-file CLI flag is
// supplied. Vitest's populateGlobal does not override it with jsdom's version
// because the key is not in its allow-list. Zustand's persist middleware
// captures `localStorage` at module-init time (before any beforeAll hook
// runs), so we must override it here — synchronously, before any test module
// is evaluated.

const _storage: Record<string, string> = {}

const mockLocalStorage: Storage = {
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(_storage, key)
      ? _storage[key]
      : null
  },
  setItem(key: string, value: string): void {
    _storage[key] = String(value)
  },
  removeItem(key: string): void {
    Reflect.deleteProperty(_storage, key)
  },
  clear(): void {
    Object.keys(_storage).forEach(k => Reflect.deleteProperty(_storage, k))
  },
  key(index: number): string | null {
    return Object.keys(_storage)[index] ?? null
  },
  get length(): number {
    return Object.keys(_storage).length
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  configurable: true,
  writable: true,
})
