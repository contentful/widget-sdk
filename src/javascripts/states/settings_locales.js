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
    getTitle: function () { return list.label; },
    link: { state: 'spaces.detail.settings.locales.list' },
    getType: _.constant('Locales'),
    getId: _.constant('LOCALES')
  };

  var list = base({
    name: 'list',
    url: '',
    label: 'Locales',
    loadingText: 'Loading Locales...',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
      contextHistory.addEntity(listEntity);
    }],
    template: '<div cf-locale-list class="workbench locale-list entity-list"></div>'
  });

  function makeLocaleEditorState (isNew) {
    var localeEditorState = {
      template: '<cf-locale-editor class="workbench">',
      label: 'context.title + (context.dirty ? "*" : "")',
      params: { addToContext: true },
      controller: [
        '$scope', 'require', '$stateParams', 'locale',
        function ($scope, require, $stateParams, locale) {
          var $state = require('$state');

          var localeId = $stateParams.localeId;

          var id = isNew ? 'LOCALENEW' : localeId;
          var stateFragment = isNew ? 'new' : 'detail';
          var params = isNew ? undefined : { localeId: localeId };

          $scope.context = $state.current.data;
          $scope.locale = locale;

          // add list state as parent
          contextHistory.addEntity(listEntity);

          // add current state
          contextHistory.addEntity({
            getTitle: function () { return $scope.context.title + ($scope.context.dirty ? '*' : ''); },
            link: {
              state: 'spaces.detail.settings.locales.' + stateFragment,
              params: params
            },
            getType: _.constant('Locale'),
            getId: _.constant(id)
          });
        }
      ]
    };

    return localeEditorState;
  }


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
          contentDeliveryApi: true,
          contentManagementApi: true
        });
      }]
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
      }]
    }
  }, makeLocaleEditorState(false));

  return {
    name: 'locales',
    url: '/locales',
    abstract: true,
    template: '<ui-view/>',
    children: [list, newLocale, detail]
  };
}]);
