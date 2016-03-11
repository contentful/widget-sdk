'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/locales
 */
.factory('states/settings/locales', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  var list = base({
    name: '.list',
    url: '',
    ncyBreadcrumb: {
      label: 'Locales'
    },
    loadingText: 'Loading Locales...',
    template: '<div cf-locale-list class="workbench locale-list entity-list"></div>',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  });

  var localeEditorState = {
    template: '<cf-locale-editor class="workbench">',
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.locales.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    controller: ['$state', '$scope', 'locale', function ($state, $scope, locale) {
      $scope.context = $state.current.data;
      $scope.locale = locale;
    }]
  };

  var newLocale = _.extend({
    name: '.new',
    url: '_new',
    data: {
      isNew: true
    },
    resolve: {
      locale: ['$stateParams', 'space', function ($stateParams, space) {
        return space.newLocale({
          code: null,
          contentDeliveryApi: true,
          contentManagementApi: true
        });
      }]
    }
  }, localeEditorState);

  var detail = _.extend({
    name: '.detail',
    url: '/:localeId',
    data: {
      isNew: false
    },
    resolve: {
      locale: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getLocale($stateParams.localeId);
      }]
    }
  }, localeEditorState);

  return {
    name: '.locales',
    url: '/locales',
    abstract: true,
    template: '<ui-view/>',
    children: [list, newLocale, detail]
  };
}]);
