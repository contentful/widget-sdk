import { omit } from 'lodash';
import { fetchAll } from './FetchAll';

const LOCALE_ENDPOINT = 'locales';

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
    remove,
  };

  /**
   * @name localeRepo#getAll
   * @description
   * Fetches all locales within a space.
   * Goes through all the response pages if needed.
   * @returns {Promise<API.Locale[]}
   */
  async function getAll() {
    const path = [LOCALE_ENDPOINT];

    return fetchAll(spaceEndpoint, path, 100);
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
  async function save(locale) {
    const sys = locale.sys;
    const isNew = !sys || !sys.id;

    const path = [LOCALE_ENDPOINT].concat(isNew ? [] : [sys.id]);
    const method = isNew ? 'POST' : 'PUT';
    const version = isNew ? undefined : sys.version;

    // Sending `default`, `fallback_code` or `internal_code`
    // results in 422:
    // - default locale cannot be changed
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
  async function remove(id, version) {
    await spaceEndpoint({
      method: 'DELETE',
      path: [LOCALE_ENDPOINT, id],
      version,
    });
  }
}
