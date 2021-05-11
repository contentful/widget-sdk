import { omit } from 'lodash';
import type { BatchedPlainCmaClient } from 'core/services/usePlainCMAClient';
import { fetchEntireDataset } from '@contentful/experience-cma-utils';
import { CreateLocaleProps, LocaleProps } from 'contentful-management/types';

/**
 * @name LocaleRepo.create
 * @description
 * Given a space endpoint produces a repository
 * for locale management and retrieval.
 */
export function createLocaleRepo(cma: BatchedPlainCmaClient) {
  return {
    getAll,
    save,
    remove,
  };

  /**
   * @description
   * Fetches all locales within a space.
   * Goes through all the response pages if needed.
   */
  async function getAll() {
    const locales = await fetchEntireDataset(
      (query) => {
        return cma.locale.getMany({ query });
      },
      {
        limit: 100,
      }
    );
    return locales;
  }

  /**
   * @description
   * Given a locale data object creates or updates
   * a backend entity. Checks existence of `sys.id`
   * to determine what method should be used.
   * @returns Promise of an updated entity
   */
  async function save(locale: LocaleProps) {
    const sys = locale.sys;
    const isNew = !sys || !sys.id;

    // Sending `default`, `fallback_code` or `internal_code`
    // results in 422:
    // - default locale cannot be changed
    // - `fallback_code` is now `fallbackCode`
    // - `internal_code` cannot be changed
    const data = omit(locale, ['default', 'fallback_code', 'internal_code']) as LocaleProps;

    if (isNew) {
      return cma.locale.create({}, omit(data, ['sys']) as CreateLocaleProps);
    }

    return cma.locale.update({ localeId: locale.sys.id }, data);
  }

  /**
   * Removes a locale.
   */
  async function remove(id: string) {
    return cma.locale.delete({ localeId: id });
  }
}
