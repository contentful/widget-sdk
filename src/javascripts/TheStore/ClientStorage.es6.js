import createClientStorageWrapper from 'TheStore/ClientStorageWrapper';

export default function createClientStorage (storageType) {
  const storage = createClientStorageWrapper(storageType);

  return {
    get: (key) => storage.getItem(key),
    set: (key, value) => storage.setItem(key, value),
    remove: (key) => storage.removeItem(key),
    isSupported: function () {
      try {
        this.set('test', { test: true });
        this.remove('test');
        return true;
      } catch (e) {
        return false;
      }
    }
  };
}
