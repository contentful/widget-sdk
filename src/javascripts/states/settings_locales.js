'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/locales
 */
.factory('states/settings/locales', ['require', function (require) {
  var base = require('states/base');
  var contextHistory = require('contextHistory');

  var listEntity = {
    getTitle: _.constant('Locales'),
    link: { state: 'spaces.detail.settings.locales.list' },
    getType: _.constant('Locales'),
    getId: _.constant('LOCALES')
  };

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading Locales...',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
      contextHistory.addEntity(listEntity);
    }],
    template: '<div cf-locale-list class="workbench locale-list entity-list"></div>'
  });

  function makeLocaleEditorState (isNew) {
    return {
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

          // add list state as parent
          contextHistory.addEntity(listEntity);

          // add current state
          var crumb = createLocaleCrumb($scope.context, $stateParams.localeId, isNew);
          contextHistory.addEntity(crumb);
        }
      ]
    };
  }

  function createLocaleCrumb (context, localeId, isNew) {
    var id = isNew ? 'LOCALENEW' : localeId;
    var stateFragment = isNew ? 'new' : 'detail';
    var params = isNew ? undefined : { localeId: localeId };

    return {
      getTitle: function () {
        return context.title + (context.dirty ? '*' : '');
      },
      link: {
        state: 'spaces.detail.settings.locales.' + stateFragment,
        params: params
      },
      getType: _.constant('Locale'),
      getId: _.constant(id)
    };
  }

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
  }, makeLocaleEditorState(true));

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
  }, makeLocaleEditorState(false));

  return {
    name: 'locales',
    url: '/locales',
    abstract: true,
    children: [list, newLocale, detail]
  };
}]);
