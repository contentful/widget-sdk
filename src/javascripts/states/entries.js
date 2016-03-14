'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/entries
 */
.factory('states/entries', ['$injector', function ($injector) {
  var base = $injector.get('states/base');
  var filterDeletedLocales = $injector.get('states/entityLocaleFilter');
  var resolvers = $injector.get('states/resolvers');

  var list = base({
    name: 'list',
    url: '',
    ncyBreadcrumb: {
      label: 'Entries'
    },
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }],
    template: '<div cf-entry-list class="workbench entry-list entity-list"></div>'
  });

  var detail = {
    name: 'detail',
    url: '/:entryId',
    params: { addToContext: false },
    ncyBreadcrumb: {
      parent: 'spaces.detail.entries.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    resolve: {
      entry: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getEntry($stateParams.entryId).then(function (entry) {
          filterDeletedLocales(entry.data, space.getPrivateLocales());
          return entry;
        });

      }],
      editingInterface: resolvers.editingInterface,
      contentType: ['$injector', 'entry', function ($injector, entry) {
        var spaceContext = $injector.get('spaceContext');
        var ctId = entry.data.sys.contentType.sys.id;
        return spaceContext.fetchPublishedContentType(ctId);
      }],
      fieldControls: ['editingInterface', 'spaceContext', function (ei, spaceContext) {
        return spaceContext.widgets.buildRenderable(ei.controls);
      }]
    },
    controller: ['$state', '$scope', 'entry', 'fieldControls', 'contentType', 'contextHistory',
                 function ($state, $scope, entry, fieldControls, contentType, contextHistory) {
      $state.current.data = $scope.context = {};
      $scope.entry = entry;
      $scope.entity = entry;
      $scope.contentType = contentType;
      $scope.formControls = fieldControls.form;
      $scope.sidebarControls = fieldControls.sidebar;
      contextHistory.addEntity(entry);
    }],
    template:
    '<div ' + [
      'cf-entry-editor',
      'class="workbench entry-editor"',
      'ot-doc-for="entry"',
      'cf-validate="entry.data"', 'cf-entry-schema',
      'ot-doc-presence'
    ].join(' ') + '></div>'
  };


  return {
    name: 'entries',
    url: '/entries',
    abstract: true,
    template: '<ui-view/>',
    children: [list, detail]
  };
}]);
