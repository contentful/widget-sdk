'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name states/entries
   */
  .factory('states/entries', [
    'require',
    require => {
      const _ = require('lodash');
      const $state = require('$state');
      const trackVersioning = require('analyticsEvents/versioning');
      const contextHistory = require('navigation/Breadcrumbs/History.es6').default;
      const crumbFactory = require('navigation/Breadcrumbs/Factory.es6');

      const base = require('states/Base.es6').default;
      const loadEditorData = require('app/entity_editor/DataLoader.es6').loadEntry;
      const createEntityPageController = require('app/entity_editor/EntityPageController.es6')
        .default;

      const list = base({
        name: 'list',
        url: '',
        loadingText: 'Loading content…',
        template: '<div cf-entry-list class="workbench entry-list entity-list"></div>'
      });

      const compareWithCurrent = base({
        name: 'withCurrent',
        url: '/:snapshotId',
        loadingText: 'Loading versions…',
        params: {
          snapshotCount: 0,
          source: 'deepLink'
        },
        resolve: {
          snapshot: [
            'require',
            '$stateParams',
            'editorData',
            (require, $stateParams, editorData) => {
              const entry = editorData.entity;
              const contentType = editorData.contentType;
              const spaceContext = require('spaceContext');
              const Entries = require('data/Entries');

              return spaceContext.cma
                .getEntrySnapshot(entry.getId(), $stateParams.snapshotId)
                .then(snapshot =>
                  _.extend(snapshot, {
                    snapshot: Entries.externalToInternal(snapshot.snapshot, contentType.data)
                  })
                );
            }
          ]
        },
        template: '<cf-snapshot-comparator class="workbench" />',
        controller: [
          '$stateParams',
          '$scope',
          'editorData',
          'snapshot',
          ($stateParams, $scope, editorData, snapshot) => {
            const entry = editorData.entity;
            const contentType = editorData.contentType;

            $scope.widgets = _.filter(
              editorData.fieldControls.form,
              widget => !_.get(widget, 'field.disabled') || $scope.preferences.showDisabledFields
            );
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

      const compare = base({
        name: 'compare',
        url: '/compare',
        children: [compareWithCurrent],
        loadingText: 'Loading versions…',
        resolve: {
          editorData: [
            '$stateParams',
            'spaceContext',
            ($stateParams, spaceContext) => loadEditorData(spaceContext, $stateParams.entryId)
          ]
        },
        controller: [
          'require',
          'editorData',
          (require, editorData) => {
            const spaceContext = require('spaceContext');
            const modalDialog = require('modalDialog');
            const trackVersioning = require('analyticsEvents/versioning');

            const entityId = editorData.entity.getId();

            spaceContext.cma.getEntrySnapshots(entityId, { limit: 2 }).then(res => {
              const count = _.get(res, 'items.length', 0);
              return count > 0 ? compare(_.first(res.items), count) : back();
            }, back);

            function compare(snapshot, count) {
              return $state.go('.withCurrent', {
                snapshotId: snapshot.sys.id,
                snapshotCount: count,
                source: 'entryEditor'
              });
            }

            function back() {
              trackVersioning.noSnapshots(entityId);

              return modalDialog
                .open({
                  title: 'This entry has no versions',
                  message:
                    'It seems that this entry doesn’t have any versions yet. As you update it, ' +
                    'new versions will be created and you will be able to review and compare them.',
                  cancelLabel: null
                })
                .promise.finally(() => $state.go('^'));
            }
          }
        ]
      });

      return {
        withSnapshots: entriesBaseState(true),
        withoutSnapshots: entriesBaseState(false)
      };

      function entriesBaseState(withSnapshots) {
        return {
          name: 'entries',
          url: '/entries',
          abstract: true,
          children: [list, detail(withSnapshots)]
        };
      }

      function detail(withSnapshots) {
        return base({
          name: 'detail',
          url: '/:entryId?previousEntries&bulkEditor',
          children: withSnapshots ? [compare] : [],
          params: { addToContext: true },
          template: JST.entity_page(),
          controller: ['$scope', '$state', createEntityPageController]
        });
      }
    }
  ]);
