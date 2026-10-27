// Public game by default; the separate testing menu is available at ?dev=1.
export const DEVELOPMENT_MODE = new URLSearchParams(globalThis.location?.search||'').get('dev')==='1';
