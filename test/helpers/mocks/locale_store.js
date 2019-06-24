'use strict';
import _ from 'lodash';

/**
 * Provides a subset of the [`TheLocaleStore`][1] interface with additional
 * methods to set the content of the store.
 */
angular.module('contentful/mocks').factory('mocks/TheLocaleStore', [
  '$injector',
  $injector => {
    const createLocaleStore = $injector.get('services/localeStore.es6').createLocaleStore;
    const getStore = $injector.get('TheStore').getStore;
    const localeStoreMock = createLocaleStore(getStore);

    /**
     * @ngdoc method
     * @name mocks/TheLocaleStore#setLocales
     * @module contentful/mocks
     * @description
     * Set the value to be returned by `getPrivateLocales()`.
     *
     * The first value in the array will be the value returned by
     * `getDefaultLocale()`.
     *
     * @param {Array<API.Locale>} locales
     */
    localeStoreMock.setLocales = locales => {
      locales = locales.map(locale =>
        _.extend(
          {
            sys: { space: { sys: { id: 'SID' } } },
            internal_code: `${locale.code}-internal`,
            contentManagementApi: true
          },
          locale
        )
      );

      locales[0].default = true;

      localeStoreMock.init({
        // simulate promise so it's synchronous no matter what
        getAll: () => ({ then: handle => handle(locales) })
      });

      localeStoreMock.setActiveLocales(
        _.reject(locales, locale => {
          return 'active' in locale && !locale.active;
        })
      );
    };

    localeStoreMock.setLocales([{ code: 'en', name: 'English' }, { code: 'de', name: 'German' }]);

    return localeStoreMock;
  }
]);
