import { cloneDeep } from 'lodash';
import * as versioning from './versioning';
import * as analytics from 'analytics/Analytics';

const mockUnsavedChangesDialog = jest.fn().mockResolvedValue(true);

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
  getSessionData: jest.fn().mockImplementation((id) => {
    if (id === 'user.sys.id') {
      return 'uid';
    }
  }),
}));

jest.mock('app/common/UnsavedChangesDialog', () => () => mockUnsavedChangesDialog);

describe('Tracking versioning', () => {
  const data = {
    entry: { sys: { id: 'eid' } },
    snapshot: {
      sys: {
        id: 'sid',
        snapshotType: 'publication',
        createdBy: { sys: { id: 'uid' } },
      },
    },
  };

  const getTrackingData = () => {
    return analytics.track.mock.calls[0][1];
  };

  const assertAnalyticsCall = (event, expected) => {
    expect(analytics.track).toHaveBeenCalledTimes(1);
    expect(analytics.track.mock.calls[0][0]).toBe(`versioning:${event}`);
    const data = getTrackingData();
    Object.keys(expected).forEach((key) => {
      expect(data[key]).toEqual(expected[key]);
    });
  };

  const assertBasicAnalyticsCall = (event) => {
    assertAnalyticsCall(event, {
      entryId: 'eid',
      snapshotId: 'sid',
      snapshotType: 'publication',
      authorIsUser: true,
    });
  };

  beforeEach(async function () {
    versioning.setData(data.entry, data.snapshot);
  });

  describe('"authorIsUser" event data', () => {
    it('sends true if author of snapshot is the current user', function () {
      versioning.opened();
      assertAnalyticsCall('snapshot_opened', { authorIsUser: true });
    });

    it('sends false if snapshot was taken by some other user', function () {
      const snapshot = cloneDeep(data.snapshot);
      snapshot.sys.createdBy.sys.id = 'other-user';
      versioning.setData(data.entry, snapshot);

      versioning.opened();
      assertAnalyticsCall('snapshot_opened', { authorIsUser: false });
    });
  });

  describe('#noSnapshots', () => {
    it('sends entryId', function () {
      versioning.noSnapshots('xxx');
      assertAnalyticsCall('no_snapshots', { entryId: 'xxx' });
    });
  });

  describe('#opened', () => {
    it('uses "deepLink" as a default source', function () {
      versioning.opened();
      assertBasicAnalyticsCall('snapshot_opened');
      expect(getTrackingData().source).toBe('deepLink');
    });

    it('uses custom source', function () {
      versioning.opened('custom-source');
      assertBasicAnalyticsCall('snapshot_opened');
      expect(getTrackingData().source).toBe('custom-source');
    });
  });

  describe('#closed', () => {
    it('is not discarded by default', function () {
      versioning.closed();
      assertBasicAnalyticsCall('snapshot_closed');
      expect(getTrackingData().changesDiscarded).toBe(false);
    });

    it('is discarded if called with boolean true', function () {
      versioning.closed(true);
      assertBasicAnalyticsCall('snapshot_closed');
      expect(getTrackingData().changesDiscarded).toBe(true);
    });
  });

  describe('#restored', () => {
    const pathsToRestore = [1, 2, 3];
    const diffCount = 4;

    it('uses args to calculate params for partial restore', function () {
      versioning.restored(pathsToRestore, diffCount);
      assertBasicAnalyticsCall('snapshot_restored');
      assertAnalyticsCall('snapshot_restored', {
        fullRestore: false,
        restoredFieldsCount: 3,
        showDiffsOnly: false,
      });
    });

    it('uses args to calculate params for full restore', function () {
      versioning.restored([1, 2, 3, 4], diffCount);
      assertBasicAnalyticsCall('snapshot_restored');
      assertAnalyticsCall('snapshot_restored', {
        fullRestore: true,
        restoredFieldsCount: 4,
      });
    });

    it('makes use of "show only diffs" toggle', function () {
      versioning.restored(pathsToRestore, diffCount, true);
      assertBasicAnalyticsCall('snapshot_restored');
      expect(getTrackingData().showDiffsOnly).toBe(true);
    });
  });

  describe('#trackableConfirmator', () => {
    const noopSave = () => {};

    it('displays confirmation dialog', async function () {
      await versioning.trackableConfirmator(noopSave)();
      expect(mockUnsavedChangesDialog).toHaveBeenCalledTimes(1);
    });

    it('tracks close with discarded changes', async function () {
      mockUnsavedChangesDialog.mockResolvedValue({ discarded: true });

      await versioning.trackableConfirmator(noopSave)();

      assertAnalyticsCall('snapshot_closed', {
        changesDiscarded: true,
      });
    });

    it('does not track if was not discarded', async function () {
      mockUnsavedChangesDialog.mockResolvedValue(false);
      await versioning.trackableConfirmator(noopSave)();
      expect(analytics.track).not.toHaveBeenCalled();
    });
  });

  describe('#publishedRestored', () => {
    it('does nothing if entry was not restored', function () {
      versioning.publishedRestored({ sys: { version: 1, id: 'xyz' } });
      expect(analytics.track).not.toHaveBeenCalled();
    });

    it('sends entry ID if was published right after restoring', function () {
      versioning.registerRestoredVersion({ sys: { version: 1, id: 'xyz' } });
      versioning.publishedRestored({ sys: { version: 2, id: 'xyz' } });
      assertAnalyticsCall('published_restored', { entryId: 'xyz' });
    });

    it('does nothing if actions were performed between restoring and publishing', function () {
      versioning.registerRestoredVersion({ sys: { version: 1, id: 'xyz' } });
      versioning.publishedRestored({ sys: { version: 9, id: 'xyz' } });
      expect(analytics.track).not.toHaveBeenCalled();
    });
  });
});
