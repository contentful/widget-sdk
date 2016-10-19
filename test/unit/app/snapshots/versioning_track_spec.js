'use strict';

describe('Versioning tracking', function () {

  const data = {
    user: {sys: {id: 'uid'}},
    entry: {sys: {id: 'eid'}},
    snapshot: {sys: {
      id: 'sid',
      snapshotType: 'publication',
      createdBy: {sys: {id: 'uid'}}
    }}
  };

  beforeEach(function () {
    module('contentful/test');
    this.track = this.$inject('track/versioning');
    this.track.setData(data.user, data.entry, data.snapshot);
    this.pushGtm = this.$inject('analytics').pushGtm = sinon.stub();

    this.getTrackingData = () => {
      return _.first(this.pushGtm.firstCall.args);
    };

    this.assertAnalyticsCall = (event, expected) => {
      sinon.assert.calledOnce(this.pushGtm);

      const data = this.getTrackingData();
      expect(data.event).toBe('versioning:' + event);

      Object.keys(expected).forEach((key) => {
        expect(data[key]).toEqual(expected[key]);
      });
    };

    this.assertBasicAnalyticsCall = (event) => {
      this.assertAnalyticsCall(event, {
        userId: 'uid',
        entryId: 'eid',
        snapshotId: 'sid',
        snapshotType: 'publication',
        authorIsUser: true
      });
    };
  });

  describe('"authorIsUser" event data', function () {
    it('sends true if author of snapshot is the current user', function () {
      this.track.opened();
      this.assertAnalyticsCall('snapshot_opened', {authorIsUser: true});
    });

    it('sends false if snapshot was taken by some other user', function () {
      const user = {sys: {id: 'other-user'}};
      this.track.setData(user, data.entry, data.snapshot);
      this.track.opened();
      this.assertAnalyticsCall('snapshot_opened', {authorIsUser: false});
    });
  });

  describe('#noSnapshots', function () {
    it('sends entryId', function () {
      this.track.noSnapshots('xxx');
      this.assertAnalyticsCall('no_snapshots', {entryId: 'xxx'});
    });
  });

  describe('#opened', function () {
    it('uses "deepLink" as a default source', function () {
      this.track.opened();
      this.assertBasicAnalyticsCall('snapshot_opened');
      expect(this.getTrackingData().source).toBe('deepLink');
    });

    it('uses custom source', function () {
      this.track.opened('custom-source');
      this.assertBasicAnalyticsCall('snapshot_opened');
      expect(this.getTrackingData().source).toBe('custom-source');
    });
  });

  describe('#closed', function () {
    it('is not discarded by default', function () {
      this.track.closed();
      this.assertBasicAnalyticsCall('snapshot_closed');
      expect(this.getTrackingData().changesDiscarded).toBe(false);
    });

    it('is discarded if called with boolean true', function () {
      this.track.closed(true);
      this.assertBasicAnalyticsCall('snapshot_closed');
      expect(this.getTrackingData().changesDiscarded).toBe(true);
    });
  });

  describe('#restored', function () {
    const picker = {
      getPathsToRestore: _.constant([1, 2, 3]),
      getDifferenceCount: _.constant(4)
    };

    it('uses picker to calculate params for partial restore', function () {
      this.track.restored(picker);
      this.assertBasicAnalyticsCall('snapshot_restored');
      this.assertAnalyticsCall('snapshot_restored', {
        fullRestore: false,
        restoredFieldsCount: 3,
        showDiffsOnly: false
      });
    });

    it('uses picker to calculate params for full restore', function () {
      picker.getPathsToRestore = _.constant([1, 2, 3, 4]);
      this.track.restored(picker);
      this.assertBasicAnalyticsCall('snapshot_restored');
      this.assertAnalyticsCall('snapshot_restored', {
        fullRestore: true,
        restoredFieldsCount: 4
      });
    });

    it('makes use of "show only diffs" toggle', function () {
      this.track.restored(picker, true);
      this.assertBasicAnalyticsCall('snapshot_restored');
      expect(this.getTrackingData().showDiffsOnly).toBe(true);
    });
  });

  describe('#trackableConfirmator', function () {
    beforeEach(function () {
      this.$q = this.$inject('$q');
      this.dialog = this.$inject('modalDialog');
    });

    it('displays confirmation dialog', function () {
      this.dialog.open = (params) => {
        expect(params.template).toBe('confirm_leave_comparison');
        return {promise: this.$q.resolve()};
      };

      this.track.trackableConfirmator(_.noop)();
    });

    it('tracks close with discarded changes', function () {
      this.dialog.open = () => {
        return {promise: this.$q.resolve({discarded: true})};
      };

      this.track.trackableConfirmator(_.noop)();
      this.$apply();
      this.assertAnalyticsCall('snapshot_closed', {
        changesDiscarded: true
      });
    });

    it('does not track if was not discarded', function () {
      this.dialog.open = () => {
        return {promise: this.$q.resolve({discarded: false})};
      };

      this.track.trackableConfirmator(_.noop)();
      this.$apply();
      sinon.assert.notCalled(this.pushGtm);
    });
  });

  describe('#publishedRestored', function () {
    it('sends entry ID if was published right after restoring', function () {
      this.track.registerRestoredVersion({sys: {version: 1, id: 'xyz'}});
      this.track.publishedRestored({sys: {version: 2, id: 'xyz'}});
      this.assertAnalyticsCall('published_restored', {entryId: 'xyz'});
    });

    it('does nothing if actions were performed between restoring and publishing', function () {
      this.track.registerRestoredVersion({sys: {version: 1, id: 'xyz'}});
      this.track.publishedRestored({sys: {version: 9, id: 'xyz'}});
      sinon.assert.notCalled(this.pushGtm);
    });

    it('does nothing if entry was not restored', function () {
      this.track.publishedRestored({sys: {version: 1, id: 'xyz'}});
      sinon.assert.notCalled(this.pushGtm);
    });
  });
});
