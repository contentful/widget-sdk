import { cloneDeep } from 'lodash';
import sinon from 'sinon';
import { it } from 'test/utils/dsl';
import { $initialize } from 'test/utils/ng';

describe('Tracking versioning', () => {
  const data = {
    entry: { sys: { id: 'eid' } },
    snapshot: {
      sys: {
        id: 'sid',
        snapshotType: 'publication',
        createdBy: { sys: { id: 'uid' } }
      }
    }
  };

  beforeEach(async function() {
    this.analytics = {
      track: sinon.stub(),
      getSessionData: sinon
        .stub()
        .withArgs('user.sys.id')
        .returns('uid')
    };

    this.openConfirmator = sinon.stub().resolves(true);

    this.system.set('analytics/Analytics', this.analytics);
    this.system.set('app/common/UnsavedChangesDialog', {
      default: () => this.openConfirmator
    });

    this.track = await this.system.import('analytics/events/versioning');
    await $initialize(this.system);
    this.track.setData(data.entry, data.snapshot);

    this.getTrackingData = () => {
      return this.analytics.track.firstCall.args[1];
    };

    this.assertAnalyticsCall = (event, expected) => {
      sinon.assert.calledOnce(this.analytics.track);
      expect(this.analytics.track.firstCall.args[0]).toBe(`versioning:${event}`);
      const data = this.getTrackingData();
      Object.keys(expected).forEach(key => {
        expect(data[key]).toEqual(expected[key]);
      });
    };

    this.assertBasicAnalyticsCall = event => {
      this.assertAnalyticsCall(event, {
        entryId: 'eid',
        snapshotId: 'sid',
        snapshotType: 'publication',
        authorIsUser: true
      });
    };
  });

  describe('"authorIsUser" event data', () => {
    it('sends true if author of snapshot is the current user', function() {
      this.track.opened();
      this.assertAnalyticsCall('snapshot_opened', { authorIsUser: true });
    });

    it('sends false if snapshot was taken by some other user', function() {
      const snapshot = cloneDeep(data.snapshot);
      snapshot.sys.createdBy.sys.id = 'other-user';
      this.track.setData(data.entry, snapshot);

      this.track.opened();
      this.assertAnalyticsCall('snapshot_opened', { authorIsUser: false });
    });
  });

  describe('#noSnapshots', () => {
    it('sends entryId', function() {
      this.track.noSnapshots('xxx');
      this.assertAnalyticsCall('no_snapshots', { entryId: 'xxx' });
    });
  });

  describe('#opened', () => {
    it('uses "deepLink" as a default source', function() {
      this.track.opened();
      this.assertBasicAnalyticsCall('snapshot_opened');
      expect(this.getTrackingData().source).toBe('deepLink');
    });

    it('uses custom source', function() {
      this.track.opened('custom-source');
      this.assertBasicAnalyticsCall('snapshot_opened');
      expect(this.getTrackingData().source).toBe('custom-source');
    });
  });

  describe('#closed', () => {
    it('is not discarded by default', function() {
      this.track.closed();
      this.assertBasicAnalyticsCall('snapshot_closed');
      expect(this.getTrackingData().changesDiscarded).toBe(false);
    });

    it('is discarded if called with boolean true', function() {
      this.track.closed(true);
      this.assertBasicAnalyticsCall('snapshot_closed');
      expect(this.getTrackingData().changesDiscarded).toBe(true);
    });
  });

  describe('#restored', () => {
    const picker = {
      getPathsToRestore: () => [1, 2, 3],
      getDifferenceCount: () => 4
    };

    it('uses picker to calculate params for partial restore', function() {
      this.track.restored(picker);
      this.assertBasicAnalyticsCall('snapshot_restored');
      this.assertAnalyticsCall('snapshot_restored', {
        fullRestore: false,
        restoredFieldsCount: 3,
        showDiffsOnly: false
      });
    });

    it('uses picker to calculate params for full restore', function() {
      picker.getPathsToRestore = () => [1, 2, 3, 4];
      this.track.restored(picker);
      this.assertBasicAnalyticsCall('snapshot_restored');
      this.assertAnalyticsCall('snapshot_restored', {
        fullRestore: true,
        restoredFieldsCount: 4
      });
    });

    it('makes use of "show only diffs" toggle', function() {
      this.track.restored(picker, true);
      this.assertBasicAnalyticsCall('snapshot_restored');
      expect(this.getTrackingData().showDiffsOnly).toBe(true);
    });
  });

  describe('#trackableConfirmator', () => {
    const noopSave = () => {};

    it('displays confirmation dialog', function() {
      this.track.trackableConfirmator(noopSave)();

      sinon.assert.calledOnce(this.openConfirmator);
    });

    it('tracks close with discarded changes', function() {
      this.openConfirmator.resolves({ discarded: true });

      return this.track
        .trackableConfirmator(noopSave)()
        .then(() => {
          this.assertAnalyticsCall('snapshot_closed', {
            changesDiscarded: true
          });
        });
    });

    it('does not track if was not discarded', function() {
      return this.track
        .trackableConfirmator(noopSave)()
        .then(() => {
          sinon.assert.notCalled(this.analytics.track);
        });
    });
  });

  describe('#publishedRestored', () => {
    it('sends entry ID if was published right after restoring', function() {
      this.track.registerRestoredVersion({ sys: { version: 1, id: 'xyz' } });
      this.track.publishedRestored({ sys: { version: 2, id: 'xyz' } });
      this.assertAnalyticsCall('published_restored', { entryId: 'xyz' });
    });

    it('does nothing if actions were performed between restoring and publishing', function() {
      this.track.registerRestoredVersion({ sys: { version: 1, id: 'xyz' } });
      this.track.publishedRestored({ sys: { version: 9, id: 'xyz' } });
      sinon.assert.notCalled(this.analytics.track);
    });

    it('does nothing if entry was not restored', function() {
      this.track.publishedRestored({ sys: { version: 1, id: 'xyz' } });
      sinon.assert.notCalled(this.analytics.track);
    });
  });
});
