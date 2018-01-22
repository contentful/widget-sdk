import window from 'global/window';

export default function createClientStorageWrapper (storageType) {
  const wrapper = {};
  const methods = ['setItem', 'getItem', 'removeItem'];
  let storage;

  if (storageType === 'local') {
    storage = window.localStorage;
  } else if (storageType === 'session') {
    storage = window.sessionStorage;
  } else {
    throw new Error(`Invalid storage type ${storageType} passed to ClientStorageWrapper`);
  }

  methods.forEach(method => {
    wrapper[method] = function () {
      const args = Array.prototype.slice.call(arguments);

      return storage[method].apply(storage, args);
    };
  });

  return wrapper;
}
