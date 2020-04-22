import { createClientStorageWrapper } from './ClientStorageWrapper';

export function createClientStorage(storageType) {
  const storage = createClientStorageWrapper(storageType);

  return {
    get: (key) => storage.getItem(key),
    set: (key, value) => storage.setItem(key, value),
    remove: (key) => storage.removeItem(key),
  };
}
