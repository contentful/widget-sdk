/**
 * @param {API.Entity} snapshot
 * @param {Property<number>} version$
 * @param {function()} setFields
 *   Set the 'fields' value of the entity data
 */
export function create(snapshot, version$, setFields) {
  let snapshotVersion = snapshot.sys.version;
  let currentVersion;

  version$.onValue(version => {
    currentVersion = version;
  });

  return {
    hasChanges,
    revert
  };

  /**
   * @ngdoc method
   * @name Document/Reverter#hasChanges
   * @description
   * Returns true if the current data differs from the initial
   * snapshot.
   * @returns {boolean}
   */
  function hasChanges() {
    return currentVersion !== snapshotVersion;
  }

  /**
   * @ngdoc method
   * @name Document/Reverter#revert
   * @description
   * Set the `field` property of the document to the value of the
   * initial snapshot.
   */
  function revert() {
    return setFields(snapshot.fields).then(version => {
      snapshotVersion = version;
    });
  }
}
