import StorageWrapper from 'utils/TheStore/StorageWrapper';

export default function StorageStore (storageType) {
  const storageTypeMap = {
    local: 'LocalStorageStore',
    session: 'SessionStorageStore'
  };

  if (!_.has(storageTypeMap, storageType)) {
    throw new Error(`Invalid storage type ${storageType} passed to storageStore`);
  }

  const storage = StorageWrapper(storageType);

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
