import * as $q from '$q';
import dotty from 'dotty';
import * as spaceContext from 'spaceContext';

/**
 * @ngdoc method
 * @name snapshotDecorator#withCurrent
 * @param {Array<object>} snapshots
 * @returns {Promise<Array<object>>}
 * @description
 * Decorates snapshots setting snapshot.sys.isCurrent value
 * (true is it's identical to current entry version)
 * Note: it assumes that all snapshots in the array belong to the same entry.
 */
export function withCurrent (snapshots) {
  if (!snapshots.length) {
    return snapshots;
  }

  const entryId = dotty.get(snapshots[0], 'snapshot.sys.id');
  return spaceContext.cma.getEntry(entryId).then(function (entry) {
    const publishedVersion = dotty.get(entry, 'sys.publishedVersion');

    snapshots.forEach(function (snapshot) {
      const isCurrent = dotty.get(snapshot, 'snapshot.sys.publishedVersion') === publishedVersion;
      snapshot.sys.isCurrent = isCurrent;
    });

    return snapshots;
  });
}

/**
 * @ngdoc method
 * @name snapshotDecorator#withAuthorName
 * @param {Array<object>} snapshots
 * @returns {Promise<Array<object>>}
 * @description
 * Decorates snapshots setting snapshot.sys.createdBy.authorName value
 */
export function withAuthorName (snapshots) {
  const promises = snapshots.map(function (snapshot) {
    const userId = dotty.get(snapshot, 'sys.createdBy.sys.id');

    return spaceContext.users.get(userId)
      .then(function (user) {
        const authorName = user ? user.getName() : '';

        snapshot.sys.createdBy.authorName = authorName;
        return snapshot;
      });
  });

  return $q.all(promises);
}
