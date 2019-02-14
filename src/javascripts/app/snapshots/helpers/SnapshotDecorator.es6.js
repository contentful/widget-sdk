import { cloneDeep, get } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const $q = getModule('$q');

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
export function withCurrent(entrySys, snapshots) {
  const currentVersion = entrySys.version;
  if (currentVersion) {
    return cloneDeep(snapshots).map(snapshot => {
      const isCurrent = get(snapshot, 'snapshot.sys.version') === currentVersion;
      snapshot.sys.isCurrent = isCurrent;
      return snapshot;
    });
  } else {
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
export function withAuthorName(spaceContext, snapshots) {
  const promises = snapshots.map(snapshot => {
    const userId = get(snapshot, 'sys.createdBy.sys.id');

    return spaceContext.users.get(userId).then(user => {
      const authorName = user ? user.firstName + ' ' + user.lastName : '';
      const snapshotClone = cloneDeep(snapshot);
      snapshotClone.sys.createdBy.authorName = authorName;
      return snapshotClone;
    });
  });

  return $q.all(promises);
}
