import {omit} from 'lodash';
import {fetchAll} from './FetchAll';

/**
 * @name LocaleRepo.create
 * @description
 * Given a space endpoint produces a repository
 * for locale management and retrieval.
 */
export default function create (spaceEndpoint) {
  return {
    getAll,
    save,
    remove
  };

  /**
   * @name localeRepo#getAll
   * @description
   * Fetches all locales within a space.
   * Goes through all the response pages if needed.
   * @returns {Promise<API.Locale[]}
   */
  function getAll () {
    return fetchAll(spaceEndpoint, ['locales'], 100);
  }

  /**
   * @name localeRepo#save
   * @description
   * Given a locale data object creates or updates
   * a backend entity. Check `sys.id` to determine.
   * @param {API.Locale} locale
   * @returns {Promise<API.Locale>} Promise of an updated entity
   */
  function save (locale) {
    const sys = locale.sys;
    const isNew = !sys || !sys.id;

    const method = isNew ? 'POST' : 'PUT';
    const path = ['locales'].concat(isNew ? [] : [sys.id]);
    const data = omit(locale, ['sys', 'default', 'internal_code']);
    const version = isNew ? undefined : sys.version;

    return spaceEndpoint({method, path, data, version});
  }

  /**
   * @name localeRepo#remove
   * @description
   * Removes a locale.
   * @param {string} id
   * @param {integer} version
   */
  function remove (id, version) {
    return spaceEndpoint({
      method: 'DELETE',
      path: ['locales', id],
      version
    }).then(() => {});
  }
}
