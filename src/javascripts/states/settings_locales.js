'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name states/settings/locales
   */
  .factory('states/settings/locales', [
    'require',
    require => {
      var base = require('states/Base.es6').default;
      var contextHistory = require('navigation/Breadcrumbs/History.es6').default;
      var crumbFactory = require('navigation/Breadcrumbs/Factory.es6');

      var list = base({
        name: 'list',
        url: '',
        loadingText: 'Loading Locales…',
        template: '<div cf-locale-list class="workbench locale-list entity-list"></div>'
      });

      function localeEditorState(options, isNew) {
        return _.extend(
          {
            template: '<cf-locale-editor class="workbench" />',
            controller: [
              '$scope',
              '$stateParams',
              'locale',
              'spaceLocales',
              ($scope, $stateParams, locale, spaceLocales) => {
                $scope.context.isNew = isNew;
                $scope.locale = locale;
                $scope.spaceLocales = spaceLocales;

                contextHistory.set([
                  crumbFactory.LocaleList(),
                  crumbFactory.Locale($stateParams.localeId, $scope.context)
                ]);
              }
            ]
          },
          options
        );
      }

      // injecting `spaceContext` here to assure `TheLocaleStore.init` was called
      // TODO drop global `TheLocaleStore` in favour of a space-scoped service
      var resolveSpaceLocales = [
        'TheLocaleStore',
        'spaceContext',
        (TheLocaleStore, _sc) => TheLocaleStore.refresh()
      ];

      var newLocale = localeEditorState(
        {
          name: 'new',
          url: '_new',
          resolve: {
            spaceLocales: resolveSpaceLocales,
            locale: function() {
              return {
                sys: {},
                code: null,
                fallbackCode: null,
                contentDeliveryApi: true,
                contentManagementApi: true
              };
            }
          }
        },
        true
      );

      var detail = localeEditorState(
        {
          name: 'detail',
          url: '/:localeId',
          resolve: {
            spaceLocales: resolveSpaceLocales,
            locale: [
              'spaceLocales',
              '$stateParams',
              (spaceLocales, $stateParams) => {
                var id = $stateParams.localeId;
                var found = _.find(spaceLocales, { sys: { id: id } });

                if (found) {
                  return _.cloneDeep(found);
                } else {
                  throw new Error('No locale with ID ' + id + ' found.');
                }
              }
            ]
          }
        },
        false
      );

      return {
        name: 'locales',
        url: '/locales',
        abstract: true,
        children: [list, newLocale, detail]
      };
    }
  ]);
