import _ from 'lodash';
import base from 'states/Base';
import { loadEntry as loadEditorData } from 'app/entity_editor/DataLoader';
import createEntityPageController from 'app/entity_editor/EntityPageController';
import * as trackVersioning from 'analytics/events/versioning';
import * as Entries from 'data/entries';
import entityPageTemplate from 'app/entity_editor/entity_page.html';

const list = base({
  name: 'list',
  url: '',
  loadingText: 'Loading content…',
  template: '<div cf-entry-list class="workbench entry-list entity-list"></div>',
});

const compareWithCurrent = base({
  name: 'withCurrent',
  url: '/:snapshotId',
  loadingText: 'Loading versions…',
  params: {
    snapshotCount: 0,
    source: 'deepLink',
  },
  resolve: {
    snapshot: [
      '$stateParams',
      'editorData',
      'spaceContext',
      ($stateParams, editorData, spaceContext) => {
        const entry = editorData.entity;
        const contentType = editorData.contentType;

        return spaceContext.cma
          .getEntrySnapshot(entry.getId(), $stateParams.snapshotId)
          .then((snapshot) =>
            _.extend(snapshot, {
              snapshot: Entries.externalToInternal(snapshot.snapshot, contentType.data),
            })
          );
      },
    ],
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

      $scope.editorData = editorData;

      $scope.widgets = _.filter(
        editorData.fieldControls.form,
        (widget) => !_.get(widget, 'field.disabled') || $scope.preferences.showDisabledFields
      );
      // TODO remove this and use entityInfo instead
      $scope.entry = $scope.entity = entry;
      $scope.entityInfo = editorData.entityInfo;
      $scope.contentType = contentType;
      $scope.snapshot = snapshot;

      trackVersioning.setData(entry.data, snapshot);
      trackVersioning.opened($stateParams.source);
    },
  ],
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
      ($stateParams, spaceContext) => loadEditorData(spaceContext, $stateParams.entryId),
    ],
  },
  controller: [
    '$scope',
    'editorData',
    'spaceContext',
    'modalDialog',
    '$state',
    ($scope, editorData, spaceContext, modalDialog, $state) => {
      $scope.editorData = editorData;

      const entityId = editorData.entity.getId();

      spaceContext.cma.getEntrySnapshots(entityId, { limit: 2 }).then((res) => {
        const count = _.get(res, 'items.length', 0);
        return count > 0 ? compare(_.first(res.items), count) : back();
      }, back);

      function compare(snapshot, count) {
        return $state.go('.withCurrent', {
          snapshotId: snapshot.sys.id,
          snapshotCount: count,
          source: 'entryEditor',
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
            cancelLabel: null,
          })
          .promise.finally(() => $state.go('^'));
      }
    },
  ],
});

export default {
  withSnapshots: entriesBaseState(true),
  withoutSnapshots: entriesBaseState(false),
};

function entriesBaseState(withSnapshots) {
  return {
    name: 'entries',
    url: '/entries',
    abstract: true,
    children: [list, detail(withSnapshots)],
  };
}

function detail(withSnapshots) {
  return base({
    name: 'detail',
    url: '/:entryId?previousEntries&bulkEditor',
    children: withSnapshots ? [compare] : [],
    params: { addToContext: true },
    template: entityPageTemplate,
    controller: ['$scope', '$state', createEntityPageController],
  });
}
