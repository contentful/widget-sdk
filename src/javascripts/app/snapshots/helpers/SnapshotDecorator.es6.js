import $q from '$q';
import dotty from 'dotty';

/**
 * @ngdoc method
 * @name snapshotDecorator#withCurrent
 * @param {object} entrySys
 * @param {Array<object>} snapshots
 * @returns {Promise<Array<object>>}
 * @description
 * Decorates snapshots setting snapshot.sys.isCurrent value
 * (true if snapshot is identical to current entry version)
 * Note: it assumes that all snapshots in the array belong to the same entry,
 * that is passed as first parameter.
 */
export function withCurrent (entrySys, snapshots) {
  if (!snapshots.length) {
    return snapshots;
  } else {
    const version = entrySys.version;
    if (version) {
      snapshots.forEach(function (snapshot) {
        const isCurrent = dotty.get(snapshot, 'snapshot.sys.version') === version;
        snapshot.sys.isCurrent = isCurrent;
      });
    }

    return snapshots;
  }
}

/**
 * @ngdoc method
 * @name snapshotDecorator#withAuthorName
 * @param {Array<object>} snapshots
 * @returns {Promise<Array<object>>}
 * @description
 * Decorates snapshots setting snapshot.sys.createdBy.authorName value
 */
export function withAuthorName (spaceContext, snapshots) {
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
