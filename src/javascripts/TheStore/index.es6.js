/**
 * @ngdoc service
 * @name TheStore
 *
 * @description
 * This service is the central point for storing session-related user data.
 * By default it uses localStorage, but falls back gracefully into cookies.
 *
 * Subservices, "localStorageStore" and "cookieStore" implement storage-specific
 * logic. These are NOT intended to be used on their own.
 */
import ClientStorage from 'TheStore/ClientStorage';
import * as CookieStore from 'TheStore/CookieStorage';
import { forStorage } from 'TheStore/Utils';

const LocalStorage = ClientStorage('local');
const SessionStorage = ClientStorage('session');
const storage = LocalStorage.isSupported() ? LocalStorage : CookieStore;

/**
 * Allows for retrieving a store explicitly, used in cases
 * where you don't want TheStore to decide where to save
 * your data.
 * @param  {String} storageType The storage type. Valid choices are local, session, and cookie
 * @return {StorageStore|CookieStore}
 */
export function getStore (storageType) {
  const validStorageTypes = {
    local: LocalStorage,
    session: SessionStorage,
    cookie: CookieStore
  };

  if (storageType == null) {
    return forStorage(storage);
  }

  return forStorage(validStorageTypes[storageType]);
}
