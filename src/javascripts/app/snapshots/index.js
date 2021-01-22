import { extend, filter, get } from 'lodash';
import { loadEntry as loadEditorData } from 'app/entity_editor/DataLoader';
import * as trackVersioning from 'analytics/events/versioning';
import * as Entries from 'data/entries';
import { go } from 'states/Navigator';
import SnapshotRedirect from './SnapshotRedirect';
import SnapshotComparator from './SnapshotRouteComponent';
import { getSpaceContext } from 'classes/spaceContext';

const compareWithCurrent = {
  name: 'withCurrent',
  url: '/:snapshotId',
  params: { source: 'deepLink' },
  resolve: {
    snapshot: [
      '$stateParams',
      'editorData',
      async ($stateParams, editorData) => {
        const spaceContext = getSpaceContext();
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
    'editorData',
    'snapshot',
    ($stateParams, $scope, editorData, snapshot) => {
      const spaceContext = getSpaceContext();
      trackVersioning.setData(editorData.entity.data, snapshot);
      trackVersioning.opened($stateParams.source);

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
      'spaceData',
      '$stateParams',
      async (spaceData, { entryId, environmentId }) => {
        const spaceContext = await getSpaceContext().resetWithSpace(spaceData, environmentId);
        return loadEditorData(spaceContext, entryId);
      },
    ],
    snapshotId: [
      'editorData',
      async (editorData) => {
        const spaceContext = getSpaceContext();
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
