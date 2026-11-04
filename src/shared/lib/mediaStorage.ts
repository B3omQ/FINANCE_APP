/**
 * mediaStorage.ts
 * Asynchronous IndexedDB storage for binary assets (Avatar, Background Image)
 * Avoids localStorage quota limits (5MB) and eliminates UI thread serialization freezes.
 */

const DB_NAME = 'finance_app_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

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
 * Save a binary blob into IndexedDB
 */
export async function saveMediaAsset(key: MediaAssetKey, blob: Blob): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(blob, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error(`Failed to save media asset: ${key}`));
  });
}

/**
 * Retrieve a binary blob from IndexedDB
 */
export async function getMediaAsset(key: MediaAssetKey): Promise<Blob | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result instanceof Blob ? result : null);
    };
    request.onerror = () => reject(request.error || new Error(`Failed to get media asset: ${key}`));
  });
}

/**
 * Create an object URL from the stored Blob, or null if not found
 */
export async function getMediaAssetUrl(key: MediaAssetKey): Promise<string | null> {
  try {
    const blob = await getMediaAsset(key);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error(`Error loading media asset url for ${key}:`, err);
    return null;
  }
}

/**
 * Delete a media asset from IndexedDB
 */
export async function deleteMediaAsset(key: MediaAssetKey): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error(`Failed to delete media asset: ${key}`));
  });
}

