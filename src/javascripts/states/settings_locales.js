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

  var resolveSpaceLocales = ['spaceContext', function (spaceContext) {
    // TODO introduce locale repo
    return spaceContext.endpoint({method: 'GET', path: ['locales']})
    .then(function (res) { return res.items; });
  }];

  var newLocale = _.extend({
    name: 'new',
    url: '_new',
    data: {
      isNew: true
    },
    resolve: {
      locale: ['spaceContext', function (spaceContext) {
        return spaceContext.space.newLocale({
          sys: {},
          code: null,
          fallbackCode: null,
          contentDeliveryApi: true,
          contentManagementApi: true
        });
      }],
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
      locale: ['$stateParams', 'spaceContext', function ($stateParams, spaceContext) {
        // TODO introduce locale repo
        return spaceContext.endpoint({
          method: 'GET',
          path: ['locales', $stateParams.localeId]
        }).then(function (res) {
          return spaceContext.space.newLocale(res);
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
