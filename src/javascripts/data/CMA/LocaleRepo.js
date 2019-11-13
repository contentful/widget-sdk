import { omit } from 'lodash';
import { fetchAll } from './FetchAll';

/**
 * @name LocaleRepo.create
 * @description
 * Given a space endpoint produces a repository
 * for locale management and retrieval.
 */
export default function create(spaceEndpoint) {
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
  function getAll() {
    return fetchAll(spaceEndpoint, ['locales'], 100);
  }

  /**
   * @name localeRepo#save
   * @description
   * Given a locale data object creates or updates
   * a backend entity. Checks existence of `sys.id`
   * to determine what method should be used.
   * @param {API.Locale} locale
   * @returns {Promise<API.Locale>} Promise of an updated entity
   */
  function save(locale) {
    const sys = locale.sys;
    const isNew = !sys || !sys.id;

    const method = isNew ? 'POST' : 'PUT';
    const path = ['locales'].concat(isNew ? [] : [sys.id]);
    const version = isNew ? undefined : sys.version;

    // Sending `defaul`, `fallback_code` or `internal_code`
    // results in 422:
    // - defaul locale cannot be changed
    // - `fallback_code` is now `fallbackCode`
    // - `internal_code` cannot be changed
    // - additionally there's no harm in not sending `sys`
    const data = omit(locale, ['sys', 'default', 'fallback_code', 'internal_code']);

    return spaceEndpoint({ method, path, data, version });
  }

  /**
   * @name localeRepo#remove
   * @description
   * Removes a locale.
   * @param {string} id
   * @param {integer} version
   */
  function remove(id, version) {
    return spaceEndpoint({
      method: 'DELETE',
      path: ['locales', id],
      version
    }).then(() => {});
  }
}
