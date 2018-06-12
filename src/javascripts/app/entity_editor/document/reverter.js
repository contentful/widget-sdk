angular.module('contentful')
/**
 * @ngdoc type
 * @name Document/Reverter
 * @description
 * Exposes an API to revert the state of a document.
 *
 * The object is created by the entity editor Document and attached to
 * it. In the entity editor it will be available as `otDoc.reverter`.
 *
 * This interface is only used by 'app/entity_editor/StateController'.
 *
 * Tests for this are included in the Document tests.
 */
.factory('entityEditor/Document/Reverter', [() => {
  return {create: create};

  /**
   * @param {API.Entity} snapshot
   * @param {Property<number>} version$
   * @param {function()} setFields
   *   Set the 'fields' value of the entity data
   */
  function create (snapshot, version$, setFields) {
    var snapshotVersion = snapshot.sys.version;
    var currentVersion;

    version$.onValue(version => {
      currentVersion = version;
    });

    return {
      hasChanges: hasChanges,
      revert: revert
    };

    /**
     * @ngdoc method
     * @name Document/Reverter#hasChanges
     * @description
     * Returns true if the current data differs from the initial
     * snapshot.
     * @returns {boolean}
     */
    function hasChanges () {
      return currentVersion !== snapshotVersion;
    }

    /**
     * @ngdoc method
     * @name Document/Reverter#revert
     * @description
     * Set the `field` property of the document to the value of the
     * initial snapshot.
     */
    function revert () {
      return setFields(snapshot.fields)
      .then(version => {
        snapshotVersion = version;
      });
    }
  }
}]);
