/**
 * This service is the central point for storing session-related user data.
 * By default it uses localStorage.
 */

import ClientStorage from 'TheStore/ClientStorage.es6';
import { forStorage } from 'TheStore/Utils.es6';

const LocalStorage = ClientStorage('local');
const SessionStorage = ClientStorage('session');

/**
 * Allows for retrieving a store explicitly, used in cases
 * where you don't want TheStore to decide where to save
 * your data.
 * @param  {String} storageType The storage type. Valid choices are local and session
 * @return {StorageStore}
 */
export function getStore(storageType) {
  const validStorageTypes = {
    local: LocalStorage,
    session: SessionStorage
  };

  if (storageType == null) {
    return forStorage(validStorageTypes.local);
  }

  return forStorage(validStorageTypes[storageType]);
}
