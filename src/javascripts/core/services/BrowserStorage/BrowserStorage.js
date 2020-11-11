/**
 * This service is the central point for storing session-related user data.
 * By default it uses localStorage.
 */

import { createClientStorage } from './ClientStorage';
import { forStorage } from './utils';

const LocalStorage = createClientStorage('local');
const SessionStorage = createClientStorage('session');

/**
 * Allows for retrieving a store explicitly, used in cases
 * where you don't want browserStorage to decide where to save
 * your data.
 * @param  {String} storageType The storage type. Valid choices are local and session
 * @return {StorageStore}
 */
export function getBrowserStorage(storageType) {
  const validStorageTypes = {
    local: LocalStorage,
    session: SessionStorage,
  };

  if (storageType == null) {
    return forStorage(validStorageTypes.local);
  }

  return forStorage(validStorageTypes[storageType]);
}