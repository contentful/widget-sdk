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
    loadingText: 'Loading versions...',
    params: {
      snapshotCount: 0,
      source: 'deepLink'
    },
    resolve: {
      snapshot: [
        'require', '$stateParams', 'entry', 'contentType',
        function (require, $stateParams, entry, contentType) {
          var spaceContext = require('spaceContext');
          var Entries = require('data/Entries');

          return spaceContext.cma.getEntrySnapshot(entry.getId(), $stateParams.snapshotId)
          .then(function (snapshot) {
            return _.extend(snapshot, {
              snapshot: Entries.externalToInternal(snapshot.snapshot, contentType.data)
            });
          });
        }
      ]
    },
    template: '<cf-snapshot-comparator class="workbench" />',
    controller: [
      'require', '$scope', 'fieldControls', 'entry', 'contentType', 'snapshot',
      function (require, $scope, fieldControls, entry, contentType, snapshot) {
        var $state = require('$state');
        var $stateParams = require('$stateParams');
        var trackVersioning = require('analyticsEvents/versioning');

        $state.current.data = $scope.context = {};
        $scope.widgets = _.filter(fieldControls.form, function (widget) {
          return !dotty.get(widget, 'field.disabled') || $scope.preferences.showDisabledFields;
        });
        $scope.entry = $scope.entity = entry;
        $scope.contentType = contentType;
        $scope.snapshot = snapshot;

        trackVersioning.setData(entry.data, snapshot);
        trackVersioning.opened($stateParams.source);

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
    loadingText: 'Loading versions...',
    controller: ['require', 'entry', function (require, entry) {
      var spaceContext = require('spaceContext');
      var $state = require('$state');
      var modalDialog = require('modalDialog');
      var trackVersioning = require('analyticsEvents/versioning');

      spaceContext.cma.getEntrySnapshots(entry.getId(), {limit: 2})
      .then(function (res) {
        var count = dotty.get(res, 'items.length', 0);
        return count > 0 ? compare(_.first(res.items), count) : back();
      }, back);

      function compare (snapshot, count) {
        return $state.go('.withCurrent', {
          snapshotId: snapshot.sys.id,
          snapshotCount: count,
          source: 'entryEditor'
        });
      }

      function back () {
        trackVersioning.noSnapshots(entry.getId());

        return modalDialog.open({
          title: 'This entry has no versions',
          message: 'It seems that this entry doesn’t have any versions yet. As you update it, ' +
                   'new versions will be created and you will be able to review and compare them.',
          cancelLabel: null
        }).promise.finally(function () {
          return $state.go('^');
        });
      }
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
      contentType: ['spaceContext', 'entry', function (spaceContext, entry) {
        var ctId = entry.data.sys.contentType.sys.id;
        return spaceContext.publishedCTs.fetch(ctId);
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
