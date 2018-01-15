import createClientStorageWrapper from 'TheStore/ClientStorageWrapper';

export default function createClientStorage (storageType) {
  const storageTypeMap = {
    local: 'LocalStorage',
    session: 'SessionStorage'
  };

  if (!_.has(storageTypeMap, storageType)) {
    throw new Error(`Invalid storage type ${storageType} passed to ClientStorage`);
  }

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
    },
    type: storageTypeMap[storageType]
  };
}
