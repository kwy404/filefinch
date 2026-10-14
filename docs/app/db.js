// A tiny promise wrapper around IndexedDB. Everything filefinch keeps (library index, history,
// sync folders, hash cache, sync bases) lives here, in this browser only.

const NAME = 'filefinch';
const VERSION = 1;
const STORES = {
  library: { keyPath: 'id' },
  chunks: { keyPath: ['id', 'n'] },
  history: { keyPath: 'id' },
  folders: { keyPath: 'id' },
  hashes: {},
  bases: {},
};

let opening = null;

export function openDb() {
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('This browser has no IndexedDB (private mode can turn it off).'));
      return;
    }
    const req = indexedDB.open(NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, opts] of Object.entries(STORES)) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, opts.keyPath ? { keyPath: opts.keyPath } : undefined);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Close other filefinch tabs to finish updating local storage.'));
  });
  opening.catch(() => (opening = null));
  return opening;
}

const done = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

async function store(name, mode = 'readonly') {
  const db = await openDb();
  return db.transaction(name, mode).objectStore(name);
}

export const dbGet = async (name, key) => done((await store(name)).get(key));
export const dbAll = async (name, query) => done((await store(name)).getAll(query));
export const dbPut = async (name, value, key) => done((await store(name, 'readwrite')).put(value, key));
export const dbDelete = async (name, key) => done((await store(name, 'readwrite')).delete(key));
export const dbClear = async (name) => done((await store(name, 'readwrite')).clear());
