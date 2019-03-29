import { registerFactory } from 'NgRegistry.es6';
import { find, filter, uniqBy, map, includes, transform } from 'lodash';

export default function register() {
  /**
   * @ngdoc service
   * @name TheLocaleStore
   *
   * @description
   * This service holds information about the locales for the current
   * space. When space is changed the `init` method should be called
   * from the `spaceContext`.
   *
   * This service also stores locale preferences in localStorage.
   *
   * TODO attach it to `spaceContext` instead of being global
   * TODO figure out the balance between store and repo
   */
  registerFactory('TheLocaleStore', [
    'TheStore/index.es6',
    'TheLocaleStore/implementation',
    ({ getStore }, { create }) => {
      return create(getStore);
    }
  ]);

  registerFactory('TheLocaleStore/implementation', () => {
    return {
      create
    };

    function create(getStore) {
      const stores = {
        activeLocales: null,
        focusedLocale: null,
        isSingleLocaleModeOn: false
      };

      let focusedLocale = null;
      let defaultLocale = null;
      let _isSingleLocaleModeOn = false;

      let localeRepo = {
        getAll: function() {
          throw new Error('Call .init(localeRepo) first');
        }
      };

      // All locales fetched from the CMA, including delivery-only locales
      let locales = [];
      // Locales that can be used for entity editing
      let privateLocales = [];
      // List of currently active locales in entity editors
      let activeLocales = [];

      /**
       * Map of current locales and their active state.
       * If a locale is "active" it means the user can see it for editing
       * on the entry/asset editors.
       * This map uses internal locale codes as keys.
       */
      let codeToActiveLocaleMap = {};

      return {
        init,
        refresh,
        getLocales,
        getDefaultLocale,
        getActiveLocales,
        getPrivateLocales,
        toInternalCode,
        toPublicCode,
        setActiveLocales,
        isLocaleActive,
        deactivateLocale,
        getFocusedLocale,
        setFocusedLocale,
        setSingleLocaleMode,
        isSingleLocaleModeOn,
        toggleSingleLocaleMode
      };

      function getFocusedLocale() {
        return focusedLocale;
      }

      function setFocusedLocale(locale) {
        focusedLocale = locale;
        stores.focusedLocale.set(locale);
      }

      function isSingleLocaleModeOn() {
        return _isSingleLocaleModeOn;
      }

      function setSingleLocaleMode(state) {
        _isSingleLocaleModeOn = state;
        stores.isSingleLocaleModeOn.set(state);
      }

      function toggleSingleLocaleMode() {
        _isSingleLocaleModeOn = !_isSingleLocaleModeOn;
      }

      /**
       * @name TheLocaleStore#init
       * @description
       * Sets locale repo for the current space and calls
       * #refresh().
       * @param {Data.LocaleRepo} _localeRepo
       * @returns {Promise<API.Locale[]>}
       */
      function init(_localeRepo) {
        localeRepo = _localeRepo;
        return refresh();
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#refresh
       * @description
       * Updates the store's state by getting data from
       * the CMA `/locales` endpoint.
       * @returns {Promise<API.Locale[]>}
       */
      function refresh() {
        return localeRepo.getAll().then(_locales => {
          locales = _locales;
          privateLocales = locales.filter(locale => locale.contentManagementApi);
          defaultLocale = find(privateLocales, { default: true }) || privateLocales[0];

          const spaceId = defaultLocale.sys.space.sys.id;

          refreshActiveLocales(spaceId);
          refreshFocusedLocalesForSpace(spaceId);
          refreshLocaleModeForSpace(spaceId);

          return locales;
        });
      }

      function refreshActiveLocales(spaceId) {
        stores.activeLocales = getStore().forKey('activeLocalesForSpace.' + spaceId);

        const storedLocaleCodes = stores.activeLocales.get() || activeLocales;
        const storedLocales = filter(privateLocales, locale =>
          includes(storedLocaleCodes, locale.code)
        );
        setActiveLocales(storedLocales);
      }

      function refreshFocusedLocalesForSpace(spaceId) {
        stores.focusedLocale = getStore().forKey('focusedLocaleForSpace.' + spaceId);
        setFocusedLocale(stores.focusedLocale.get() || defaultLocale);
      }

      function refreshLocaleModeForSpace(spaceId) {
        stores.isSingleLocaleModeOn = getStore().forKey('isSingleLocaleModeOnForSpace.' + spaceId);
        setSingleLocaleMode(stores.isSingleLocaleModeOn.get() || _isSingleLocaleModeOn);
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#isLocaleActive
       * @description
       * Returns true if a given locale is active, false otherwise
       * @param {API.Locale} locale
       * @returns {boolean}
       */
      function isLocaleActive(locale) {
        return !!codeToActiveLocaleMap[locale.internal_code];
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#getDefaultLocale
       * @returns {API.Locale}
       */
      function getDefaultLocale() {
        return defaultLocale;
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#getActiveLocales
       * @description
       * Returns a list of all locale objects that are currently active.
       *
       * This is used by the Asset and Entry editor to determine which
       * fields to display.
       *
       * @returns {Array<API.Locale>}
       */
      function getActiveLocales() {
        return activeLocales;
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#getLocales
       * @description
       * Returns a list of all locales, including delivery-only ones.
       *
       * @returns {Array<API.Locale>}
       */
      function getLocales() {
        return locales;
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#getPrivateLocales
       * @description
       * Returns a list of all locales for which content management is
       * enabled in this space.
       *
       * @returns {Array<API.Locale>}
       */
      function getPrivateLocales() {
        return privateLocales;
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#setActiveLocales
       *
       * @param {Array<API.Locale>} locales
       *
       * @description
       * Activates exactly the locales in the list.
       *
       * ~~~js
       * localeStore.setActiveLocales([{internal_code: 'en'}])
       * assert(localeStore.isLocaleActive({internal_code: 'en'})
       * ~~~
       */
      function setActiveLocales(locales) {
        if (defaultLocale) {
          locales = locales.concat([defaultLocale]);
        }

        codeToActiveLocaleMap = transform(
          locales,
          (map, locale) => {
            map[locale.internal_code] = true;
          },
          {}
        );

        updateActiveLocalesList();
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#deactivateLocale
       *
       * @param {API.Locale} locale
       *
       * @description
       * Activates exactly the locales in the list.
       *
       * ~~~js
       * localeStore.setActiveLocales([{internal_code: 'en'}])
       * localeStore.deactivateLocale({internal_code: 'en'})
       * assert(!localeStore.isLocaleActive({internal_code: 'en'})
       * ~~~
       */
      function deactivateLocale(locale) {
        delete codeToActiveLocaleMap[locale.internal_code];
        updateActiveLocalesList();
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#toInternalCode
       * @param {string} publicCode
       * @returns {string}
       */
      function toInternalCode(publicCode) {
        const locale = find(privateLocales, { code: publicCode });
        return locale && locale.internal_code;
      }

      /**
       * @ngdoc method
       * @name TheLocaleStore#toInternalCode
       * @param {string} publicCode
       * @returns {string}
       */
      function toPublicCode(internalCode) {
        const locale = find(privateLocales, { internal_code: internalCode });
        return locale && locale.code;
      }

      /**
       * Update the list of active locales from the `codeToActiveLocaleMap`
       * hash.
       */
      function updateActiveLocalesList() {
        activeLocales = filter(privateLocales, isLocaleActive);
        activeLocales = uniqBy(activeLocales, 'internal_code');

        stores.activeLocales.set(map(activeLocales, 'code'));
      }
    }
  });
}
