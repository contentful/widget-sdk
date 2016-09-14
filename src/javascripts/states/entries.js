'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/entries
 */
.factory('states/entries', ['require', function (require) {
  var contextHistory = require('contextHistory');
  var spaceContext = require('spaceContext');

  var base = require('states/base');
  var resolvers = require('states/resolvers');
  var filterDeletedLocales = require('states/entityLocaleFilter');

  var listEntity = {
    getTitle: function () { return 'Content'; },
    link: { state: 'spaces.detail.entries.list' },
    getType: _.constant('Entries'),
    getId: _.constant('ENTRIES')
  };

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading content...',
    controller: [function () {
      contextHistory.addEntity(listEntity);
    }],
    template: '<div cf-entry-list class="workbench entry-list entity-list"></div>'
  });

  var compareWithCurrent = base({
    name: 'withCurrent',
    url: '/:snapshotId',
    loadingText: 'Loading snapshot...',
    resolve: {
      snapshot: ['$stateParams', 'data/entrySnapshots', 'contentType', function ($stateParams, repo, ct) {
        return repo.getOne($stateParams.snapshotId, ct);
      }]
    },
    template: '<cf-snapshot-comparator class="workbench" />',
    controller: [
      '$scope', 'fieldControls', 'entry', 'contentType', 'snapshot',
      function ($scope, fieldControls, entry, contentType, snapshot) {
        $scope.context = {ready: true};
        $scope.widgets = fieldControls.form;
        $scope.entry = $scope.entity = entry;
        $scope.contentType = contentType;
        $scope.snapshot = snapshot;

        contextHistory.addEntity(listEntity);
        contextHistory.addEntity(buildEntryCrumb(entry));
        contextHistory.addEntity({
          getTitle: _.constant(spaceContext.entryTitle(entry)),
          link: {
            state: 'spaces.detail.entries.compare.withCurrent',
            params: {snapshotId: snapshot.id}
          },
          getType: _.constant('SnapshotComparison'),
          getId: _.constant(snapshot.sys.id)
        });
      }
    ]
  });

  var compare = base({
    name: 'compare',
    url: '/compare',
    children: [compareWithCurrent],
    loadingText: 'Loading snapshot...',
    controller: ['require', function (require) {
      var snapshotRepo = require('data/entrySnapshots');
      var $state = require('$state');

      snapshotRepo.getList({}).then(function (snapshots) {
        $state.go('.withCurrent', {snapshotId: snapshots[0].sys.id});
      });
    }]
  });

  var detail = {
    name: 'detail',
    url: '/:entryId',
    children: [compare],
    params: { addToContext: true, notALinkedEntity: false },
    resolve: {
      entry: ['$stateParams', 'space', function ($stateParams, space) {
        return space.getEntry($stateParams.entryId).then(function (entry) {
          filterDeletedLocales(entry.data, space.getPrivateLocales());
          return entry;
        });
      }],
      editingInterface: resolvers.editingInterface,
      contentType: ['entry', function (entry) {
        var ctId = entry.data.sys.contentType.sys.id;
        return spaceContext.fetchPublishedContentType(ctId);
      }],
      fieldControls: ['editingInterface', function (ei) {
        return spaceContext.widgets.buildRenderable(ei.controls);
      }]
    },
    controller: [
      '$scope', 'require', 'entry', 'contentType', 'fieldControls',
      function ($scope, require, entry, contentType, fieldControls) {
        require('$state').current.data = $scope.context = {};
        $scope.entry = entry;
        $scope.entity = entry;
        $scope.contentType = contentType;
        $scope.formControls = fieldControls.form;
        $scope.sidebarControls = fieldControls.sidebar;

        // purge context history
        if (require('$stateParams').notALinkedEntity) {
          contextHistory.purge();
        }

        // add list as parent state only if it's a deep link
        if (contextHistory.isEmpty()) {
          contextHistory.addEntity(listEntity);
        }

        // add current state
        contextHistory.addEntity(buildEntryCrumb(entry));
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
    children: [list, detail]
  };

  function buildEntryCrumb (entry) {
    return {
      getTitle: function () {
        var asterisk = 'hasUnpublishedChanges' in entry && entry.hasUnpublishedChanges() ? '*' : '';
        return spaceContext.entryTitle(entry) + asterisk;
      },
      link: {
        state: 'spaces.detail.entries.detail',
        params: { entryId: entry.getId() }
      },
      getType: entry.getType.bind(entry),
      getId: _.constant(entry.getId())
    };
  }
}]);
