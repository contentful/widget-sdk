'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/locales
 */
.factory('states/settings/locales', ['require', function (require) {
  var base = require('states/Base').default;
  var contextHistory = require('contextHistory');
  var crumbFactory = require('navigation/CrumbFactory');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading Locales…',
    template: '<div cf-locale-list class="workbench locale-list entity-list"></div>'
  });

  var localeEditorState = {
    template: '<cf-locale-editor class="workbench" />',
    controller: [
      '$scope', '$stateParams', 'locale', 'spaceLocales',
      function ($scope, $stateParams, locale, spaceLocales) {
        $scope.locale = locale;
        $scope.spaceLocales = spaceLocales;

        contextHistory.set([
          crumbFactory.LocaleList(),
          crumbFactory.Locale($stateParams.localeId, $scope.context)
        ]);
      }
    ]
  };

  // injecting `spaceContext` here to assure `TheLocaleStore.init` was called
  // TODO drop global `TheLocaleStore` in favour of a space-scoped service
  var resolveSpaceLocales = ['TheLocaleStore', 'spaceContext', function (TheLocaleStore, _sc) {
    return TheLocaleStore.refresh();
  }];

  var newLocale = _.extend({
    name: 'new',
    url: '_new',
    data: {
      isNew: true
    },
    resolve: {
      spaceLocales: resolveSpaceLocales,
      locale: function () {
        return {
          sys: {},
          code: null,
          fallbackCode: null,
          contentDeliveryApi: true,
          contentManagementApi: true
        };
      }
    }
  }, localeEditorState);

  var detail = _.extend({
    name: 'detail',
    url: '/:localeId',
    data: {
      isNew: false
    },
    resolve: {
      spaceLocales: resolveSpaceLocales,
      locale: ['spaceLocales', '$stateParams', function (spaceLocales, $stateParams) {
        var id = $stateParams.localeId;
        var found = _.find(spaceLocales, {sys: {id: id}});

        if (found) {
          return _.cloneDeep(found);
        } else {
          throw new Error('No locale with ID ' + id + ' found.');
        }
      }]
    }
  }, localeEditorState);

  return {
    name: 'locales',
    url: '/locales',
    abstract: true,
    children: [list, newLocale, detail]
  };
}]);
