import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog.es6';
import * as Analytics from 'analytics/Analytics.es6';

let data = {};
const restoredVersions = {};

export function setData(entry, snapshot) {
  data = {
    entry: entry,
    snapshot: snapshot
  };
}

export function noSnapshots(entryId) {
  track('no_snapshots', { entryId });
}

export function opened(source) {
  track(
    'snapshot_opened',
    Object.assign(
      {
        source: source || 'deepLink'
      },
      basicInfo()
    )
  );
}

export function closed(discarded) {
  track(
    'snapshot_closed',
    Object.assign(
      {
        changesDiscarded: !!discarded
      },
      basicInfo()
    )
  );
}

export function restored(picker, showDiffsOnly) {
  const count = picker.getPathsToRestore().length;

  track(
    'snapshot_restored',
    Object.assign(
      {
        fullRestore: count === picker.getDifferenceCount(),
        restoredFieldsCount: count,
        showDiffsOnly: !!showDiffsOnly
      },
      basicInfo()
    )
  );
}

export function registerRestoredVersion(entry) {
  restoredVersions[entry.sys.id] = entry.sys.version;
}

export function publishedRestored(entry) {
  const id = entry.sys.id;

  if (entry.sys.version - restoredVersions[id] < 2) {
    track('published_restored', { entryId: id });
  }
}

export function trackableConfirmator(save) {
  const confirmator = createUnsavedChangesDialogOpener(save);

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
  Analytics.track(`versioning:${event}`, data);
}
