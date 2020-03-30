import { extend, filter, get } from 'lodash';
import { loadEntry as loadEditorData } from 'app/entity_editor/DataLoader';
import * as trackVersioning from 'analytics/events/versioning';
import * as Entries from 'data/entries';
import { go } from 'states/Navigator';
import SnapshotRedirect from './SnapshotRedirect';
import SnapshotComparator from './SnapshotRouteComponent';

const compareWithCurrent = {
  name: 'withCurrent',
  url: '/:snapshotId',
  params: { source: 'deepLink' },
  resolve: {
    snapshot: [
      '$stateParams',
      'editorData',
      'spaceContext',
      async ($stateParams, editorData, spaceContext) => {
        const { entity, contentType } = editorData;
        const snapshot = await spaceContext.cma.getEntrySnapshot(
          entity.getId(),
          $stateParams.snapshotId
        );

        return extend(snapshot, {
          snapshot: Entries.externalToInternal(snapshot.snapshot, contentType.data),
        });
      },
    ],
  },
  component: SnapshotComparator,
  mapInjectedToProps: [
    '$stateParams',
    '$scope',
    'spaceContext',
    'editorData',
    'snapshot',
    ($stateParams, $scope, spaceContext, editorData, snapshot) => {
      trackVersioning.setData(editorData.entity.data, snapshot);
      trackVersioning.opened($stateParams.source);

      $scope.context.ready = true;

      return {
        snapshot,
        widgets: filter(
          editorData.fieldControls.form,
          (widget) => !get(widget, 'field.disabled') || $scope.preferences.showDisabledFields
        ),
        onUpdateEntry: (entry) => spaceContext.cma.updateEntry(entry),
        getEditorData: () => editorData, // Workaround for 'RangeError' when passing circular object as prop
        registerSaveAction: (save) => {
          $scope.context.requestLeaveConfirmation = save;
          $scope.$applyAsync();
        },
        setDirty: (value) => {
          $scope.context.dirty = value;
          $scope.$applyAsync();
        },
        redirect: (reload) => {
          if (reload) return go({ path: '^.^', options: { reload: true } });
          return go({ path: '^.^' });
        },
        goToSnapshot: (snapshotId) => {
          $scope.context.ready = false;
          go({ path: '.', params: { snapshotId, source: 'compareView' } });
        },
      };
    },
  ],
};

export default {
  name: 'compare',
  url: '/compare',
  children: [compareWithCurrent],
  component: SnapshotRedirect,
  resolve: {
    editorData: [
      '$stateParams',
      'spaceContext',
      ({ entryId }, spaceContext) => loadEditorData(spaceContext, entryId),
    ],
    snapshotId: [
      'editorData',
      'spaceContext',
      async (editorData, spaceContext) => {
        const entityId = editorData.entity.getId();
        try {
          const res = await spaceContext.cma.getEntrySnapshots(entityId, { limit: 2 });
          const firstSnapshotId = get(res, 'items[0].sys.id');
          return firstSnapshotId;
        } catch (error) {} // eslint-disable-line no-empty
        trackVersioning.noSnapshots(entityId);
      },
    ],
  },
  mapInjectedToProps: ['snapshotId', (snapshotId) => ({ snapshotId })],
};
