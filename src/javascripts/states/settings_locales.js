'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/locales
 */
.factory('states/settings/locales', ['require', function (require) {
  var base = require('states/base');
  var contextHistory = require('contextHistory');
  var crumbFactory = require('navigation/CrumbFactory');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading Locales...',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
      contextHistory.add(crumbFactory.LocaleList());
    }],
    template: '<div cf-locale-list class="workbench locale-list entity-list"></div>'
  });

  var localeEditorState = {
    template: '<cf-locale-editor class="workbench" />',
    params: { addToContext: true },
    controller: [
      '$scope', 'require', 'locale', 'spaceLocales',
      function ($scope, require, locale, spaceLocales) {
        var $state = require('$state');
        var $stateParams = require('$stateParams');

        $scope.context = $state.current.data;
        $scope.locale = locale;
        $scope.spaceLocales = spaceLocales;

        contextHistory.add(crumbFactory.LocaleList());
        contextHistory.add(crumbFactory.Locale($stateParams.localeId, $scope.context));
      }
    ]
  };

  var resolveSpaceLocales = ['space', function (space) {
    return space.getLocales();
  }];

  var newLocale = _.extend({
    name: 'new',
    url: '_new',
    data: {
      isNew: true
    },
    resolve: {
      locale: ['space', function (space) {
        return space.newLocale({
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
      locale: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getLocale($stateParams.localeId);
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
