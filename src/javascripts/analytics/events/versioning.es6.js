import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import leaveConfirmator from 'navigation/confirmLeaveEditor.es6';

export default function register() {
  registerFactory('analyticsEvents/versioning', [
    'analytics/Analytics.es6',
    Analytics => {
      let data = {};
      const restoredVersions = {};

      return {
        setData,
        noSnapshots,
        opened,
        closed,
        restored,
        registerRestoredVersion,
        publishedRestored,
        trackableConfirmator
      };

      function setData(entry, snapshot) {
        data = {
          entry: entry,
          snapshot: snapshot
        };
      }

      function noSnapshots(entryId) {
        track('no_snapshots', { entryId: entryId });
      }

      function opened(source) {
        track(
          'snapshot_opened',
          _.extend(
            {
              source: source || 'deepLink'
            },
            basicInfo()
          )
        );
      }

      function closed(discarded) {
        track(
          'snapshot_closed',
          _.extend(
            {
              changesDiscarded: !!discarded
            },
            basicInfo()
          )
        );
      }

      function restored(picker, showDiffsOnly) {
        const count = picker.getPathsToRestore().length;

        track(
          'snapshot_restored',
          _.extend(
            {
              fullRestore: count === picker.getDifferenceCount(),
              restoredFieldsCount: count,
              showDiffsOnly: !!showDiffsOnly
            },
            basicInfo()
          )
        );
      }

      function registerRestoredVersion(entry) {
        restoredVersions[entry.sys.id] = entry.sys.version;
      }

      function publishedRestored(entry) {
        const id = entry.sys.id;

        if (entry.sys.version - restoredVersions[id] < 2) {
          track('published_restored', { entryId: id });
        }
      }

      function trackableConfirmator(save) {
        const confirmator = leaveConfirmator(save, 'confirm_leave_comparison');

        return () =>
          confirmator().then(result => {
            if (result && result.discarded) {
              closed(true);
            }

            return result;
          });
      }

      function basicInfo() {
        const userId = Analytics.getSessionData('user.sys.id');
        const snapshotSys = data.snapshot.sys;

        return {
          entryId: data.entry.sys.id,
          snapshotId: snapshotSys.id,
          snapshotType: snapshotSys.snapshotType,
          authorIsUser: userId === snapshotSys.createdBy.sys.id
        };
      }

      function track(event, data) {
        Analytics.track('versioning:' + event, data);
      }
    }
  ]);
}
