'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/entries
 */
.factory('states/entries', ['require', function (require) {
  var contextHistory = require('contextHistory');

  var base = require('states/base');
  var resolvers = require('states/resolvers');
  var filterDeletedLocales = require('states/entityLocaleFilter');

  var listEntity = {
    getTitle: function () { return list.label; },
    link: { state: 'spaces.detail.entries.list' },
    getType: _.constant('Entries'),
    getId: _.constant('ENTRIES')
  };

  var list = base({
    name: 'list',
    url: '',
    label: 'Content',
    loadingText: 'Loading content...',
    controller: [function () {
      contextHistory.addEntity(listEntity);
    }],
    template: '<div cf-entry-list class="workbench entry-list entity-list"></div>'
  });

  var detail = {
    name: 'detail',
    url: '/:entryId',
    params: { addToContext: true, notALinkedEntity: false },
    label: 'context.title + (context.dirty ? "*" : "")',
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
    controller: [
      '$scope', 'require', 'entry', 'contentType', 'fieldControls',
      function ($scope, require, entry, contentType, fieldControls) {
        var $state = require('$state');
        var spaceContext = require('spaceContext');
        var $stateParams = require('$stateParams');

        var entryId = $stateParams.entryId;
        var entryEntity = {};

        $state.current.data = $scope.context = {};
        $scope.entry = entry;
        $scope.entity = entry;
        $scope.contentType = contentType;
        $scope.formControls = fieldControls.form;
        $scope.sidebarControls = fieldControls.sidebar;

        // build entry entity
        entryEntity.getTitle = function () {
          var title = 'hasUnpublishedChanges' in entry && entry.hasUnpublishedChanges() ? '*' : '';

          return spaceContext.entryTitle(entry) + title;
        };

        entryEntity.link = {
          state: 'spaces.detail.entries.detail',
          params: { entryId: entryId }
        };

        entryEntity.getType = entry.getType.bind(entry);

        entryEntity.getId = _.constant(entryId);

        // purge context history
        if ($stateParams.notALinkedEntity) {
          contextHistory.purge();
        }

        // add list as parent state only if it's a deep link
        if (contextHistory.isEmpty()) {
          contextHistory.addEntity(listEntity);
        }

        // add current state
        contextHistory.addEntity(entryEntity);
      }],
    template:
    '<div ' + [
      'cf-entry-editor',
      'class="workbench entry-editor"',
      'cf-validate="entry.data"', 'cf-entry-schema'
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
