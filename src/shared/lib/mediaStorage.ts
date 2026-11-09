/**
 * mediaStorage.ts
 * Asynchronous IndexedDB storage for binary assets (Avatar, Background Image)
 * Avoids localStorage quota limits (5MB) and eliminates UI thread serialization freezes.
 */

const DB_NAME = 'finance_app_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'assets';
const AVATAR_LOCALSTORAGE_KEY = 'finance_app_avatar_data';

export type MediaAssetKey = 'user_avatar' | 'user_background';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open media database'));
    };
  });
}

/**
 * Save a binary blob or data URL string into IndexedDB (and localStorage fallback for avatar)
 */
export async function saveMediaAsset(key: MediaAssetKey, data: Blob | string): Promise<void> {
  if (key === 'user_avatar' && typeof data === 'string') {
    try {
      localStorage.setItem(AVATAR_LOCALSTORAGE_KEY, data);
    } catch (e) {
      console.warn('Failed to cache avatar in localStorage, will rely on IndexedDB:', e);
    }
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error(`Failed to save media asset: ${key}`));
  });
}

/**
 * Retrieve a binary blob or data URL string from IndexedDB
 */
export async function getMediaAsset(key: MediaAssetKey): Promise<Blob | string | null> {
  // Synchronous fast-path for avatar cached in localStorage
  if (key === 'user_avatar') {
    try {
      const cached = localStorage.getItem(AVATAR_LOCALSTORAGE_KEY);
      if (cached) return cached;
    } catch {
      // Ignore localStorage errors
    }
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      if (result instanceof Blob || typeof result === 'string') {
        if (key === 'user_avatar' && typeof result === 'string') {
          try {
            localStorage.setItem(AVATAR_LOCALSTORAGE_KEY, result);
          } catch {
            // Ignore quota issues
          }
        }
        resolve(result);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error || new Error(`Failed to get media asset: ${key}`));
  });
}

/**
 * Create an accessible URL (Data URL or Object URL) from stored asset, or null if not found
 */
export async function getMediaAssetUrl(key: MediaAssetKey): Promise<string | null> {
  try {
    const asset = await getMediaAsset(key);
    if (!asset) return null;
    if (typeof asset === 'string') return asset;
    return URL.createObjectURL(asset);
  } catch (err) {
    console.error(`Error loading media asset url for ${key}:`, err);
    return null;
  }
}

/**
 * Delete a media asset from IndexedDB and localStorage
 */
export async function deleteMediaAsset(key: MediaAssetKey): Promise<void> {
  if (key === 'user_avatar') {
    try {
      localStorage.removeItem(AVATAR_LOCALSTORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error(`Failed to delete media asset: ${key}`));
  });
}

