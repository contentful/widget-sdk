'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/entries
 */
.factory('states/entries', ['require', function (require) {
  var $state = require('$state');
  var trackVersioning = require('analyticsEvents/versioning');
  var contextHistory = require('navigation/Breadcrumbs/History').default;
  var crumbFactory = require('navigation/Breadcrumbs/Factory');
  var h = require('ui/Framework').h;

  var base = require('states/Base').default;
  var loadEditorData = require('app/entity_editor/DataLoader').loadEntry;
  var loadAssetEditorData = require('app/entity_editor/DataLoader').loadAsset;
  var createEditorController = require('app/entity_editor/EntryController').default;
  var createAssetController = require('app/entity_editor/AssetController').default;

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading content…',
    template: '<div cf-entry-list class="workbench entry-list entity-list"></div>'
  });

  var compareWithCurrent = base({
    name: 'withCurrent',
    url: '/:snapshotId',
    loadingText: 'Loading versions…',
    params: {
      snapshotCount: 0,
      source: 'deepLink'
    },
    resolve: {
      snapshot: [
        'require', '$stateParams', 'editorData',
        function (require, $stateParams, editorData) {
          var entry = editorData.entity;
          var contentType = editorData.contentType;
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
      '$stateParams', '$scope', 'editorData', 'snapshot',
      function ($stateParams, $scope, editorData, snapshot) {
        var entry = editorData.entity;
        var contentType = editorData.contentType;

        $scope.widgets = _.filter(editorData.fieldControls.form, function (widget) {
          return !_.get(widget, 'field.disabled') || $scope.preferences.showDisabledFields;
        });
        // TODO remove this and use entityInfo instead
        $scope.entry = $scope.entity = entry;
        $scope.entityInfo = editorData.entityInfo;
        $scope.contentType = contentType;
        $scope.snapshot = snapshot;

        trackVersioning.setData(entry.data, snapshot);
        trackVersioning.opened($stateParams.source);

        contextHistory.add(crumbFactory.EntryList());
        contextHistory.add(crumbFactory.Entry(entry.data.sys, $scope.context));
        contextHistory.add(crumbFactory.EntrySnapshot(snapshot.sys.id, $scope.context));
      }
    ]
  });

  var compare = base({
    name: 'compare',
    url: '/compare',
    children: [compareWithCurrent],
    loadingText: 'Loading versions…',
    controller: ['require', 'editorData', function (require, editorData) {
      var spaceContext = require('spaceContext');
      var modalDialog = require('modalDialog');
      var trackVersioning = require('analyticsEvents/versioning');

      var entityId = editorData.entity.getId();

      spaceContext.cma.getEntrySnapshots(entityId, {limit: 2})
      .then(function (res) {
        var count = _.get(res, 'items.length', 0);
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
        trackVersioning.noSnapshots(entityId);

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

  function wrap (template) {
    return [
      h('.workbench-stack.animate', [
        h('.workbench-stack__padding', {ngClick: 'editorContext.closeSlideinEditor()'}),
        h('.workbench-stack__content', [
          h('.workbench', [
            template
          ])
        ])
      ])
    ];
  }

  var slideinEditorDetail = {
    name: 'slideinEditorDetail',
    url: '/entry/:inlineEntryId',
    // TODO: refactor
    // using `resolve` couples implementation with ui-router
    // consider moving editor data loader to the controller.
    // to be able to use as a component e.g.:
    // <cf-entry-editor entry-id="" />
    resolve: {
      inlineEditorData: ['$stateParams', 'spaceContext', function ($stateParams, spaceContext) {
        return loadEditorData(spaceContext, $stateParams.inlineEntryId);
      }]
    },
    views: {
      '': {
        template: wrap(JST.entry_editor()),
        controller: ['$scope', 'inlineEditorData', createEditorController]
      }
    }
  };

  var slideinAssetDetail = {
    name: 'slideinAssetDetail',
    url: '/asset/:inlineEntryId',
    // TODO: refactor
    // using `resolve` couples implementation with ui-router
    // consider moving editor data loader to the controller.
    // to be able to use as a component e.g.:
    // <cf-entry-editor entry-id="" />
    resolve: {
      editorData: ['$stateParams', 'spaceContext', function ($stateParams, spaceContext) {
        return loadAssetEditorData(spaceContext, $stateParams.inlineEntryId);
      }]
    },
    views: {
      '': {
        template: wrap(JST.asset_editor()),
        controller: ['$scope', 'editorData', createAssetController]
      }
    }
  };

  return {
    withSnapshots: entriesBaseState(true),
    withoutSnapshots: entriesBaseState(false)
  };

  function entriesBaseState (withSnapshots) {
    return {
      name: 'entries',
      url: '/entries',
      abstract: true,
      children: [list, detail(withSnapshots)]
    };
  }

  function detail (withSnapshots) {
    return base({
      name: 'detail',
      url: '/:entryId',
      children: withSnapshots ? [compare, slideinEditorDetail, slideinAssetDetail] : [slideinEditorDetail, slideinAssetDetail],
      params: { addToContext: true },
      resolve: {
        editorData: ['$stateParams', 'spaceContext', function ($stateParams, spaceContext) {
          return loadEditorData(spaceContext, $stateParams.entryId);
        }]
      },
      controller: ['$scope', 'editorData', createEditorController],
      template: JST.entry_editor()
    });
  }
}]);
