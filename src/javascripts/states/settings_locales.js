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
  var TheLocaleStore = require('TheLocaleStore');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading Locales…',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-locale-list class="workbench locale-list entity-list"></div>'
  });

  var localeEditorState = {
    template: '<cf-locale-editor class="workbench" />',
    controller: [
      '$scope', 'require', 'locale', 'spaceLocales',
      function ($scope, require, locale, spaceLocales) {
        var $state = require('$state');
        var $stateParams = require('$stateParams');

        $scope.context = $state.current.data;
        $scope.locale = locale;
        $scope.spaceLocales = spaceLocales;

        contextHistory.set([
          crumbFactory.LocaleList(),
          crumbFactory.Locale($stateParams.localeId, $scope.context)
        ]);
      }
    ]
  };

  var resolveSpaceLocales = function () {
    return TheLocaleStore.refresh().then(function () {
      return TheLocaleStore.getLocales();
    });
  };

  var newLocale = _.extend({
    name: 'new',
    url: '_new',
    data: {
      isNew: true
    },
    resolve: {
      locale: function () {
        return {
          sys: {},
          code: null,
          fallbackCode: null,
          contentDeliveryApi: true,
          contentManagementApi: true
        };
      },
      spaceLocales: resolveSpaceLocales
    }
  }, localeEditorState);

  var detail = _.extend({
    name: 'detail',
    url: '/:localeId',
    data: {
      isNew: false
    },
    resolve: {
      locale: ['$stateParams', function ($stateParams) {
        var id = $stateParams.localeId;
        return TheLocaleStore.refresh().then(function () {
          var found = _.find(TheLocaleStore.getLocales(), {sys: {id: id}});
          return found || Promise.reject(new Error('No locale with ID ' + id + ' found.'));
        });
      }],
      spaceLocales: resolveSpaceLocales
    }
  }, localeEditorState);

  return {
    name: 'locales',
    url: '/locales',
    abstract: true,
    children: [list, newLocale, detail]
  };
}]);
