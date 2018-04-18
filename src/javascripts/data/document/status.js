angular.module('contentful')

/**
 * @ngdoc service
 * @name data/Document/Status
 * @description
 * Internal factory for the 'status$' property of
 * 'app/entity_editor/Document'. See the documentation there.
 *
 * Tested in the 'app/entity_editor/Document' tests.
 */
.factory('data/Document/Status', ['require', function (require) {
  var K = require('utils/kefir');
  var Logger = require('logger');

  var Status = {
    NOT_ALLOWED: 'editing-not-allowed',
    CONNECTION_ERROR: 'ot-connection-error',
    ARCHIVED: 'archived',
    DELETED: 'deleted',
    OK: 'ok'
  };

  return {
    create: create,
    Status: Status
  };

  /**
   * @description
   * Returns a property that holds one of the values from the 'Status'
   * map.
   *
   * @param {K.Property<API.Entity.Sys>} sys$
   * @param {K.Property<string?>} docError$
   * @param {boolean} canUpdate
   * @returns {K.Property<string>}
   */
  function create (sys$, docError$, canUpdate) {
    if (canUpdate) {
      return K.combineProperties(
        [sys$, docError$],
        function (sys, docError) {
          if (docError === 'forbidden') {
            return Status.NOT_ALLOWED;
          } else if (docError === 'disconnected') {
            return Status.CONNECTION_ERROR;
          } else if (docError) {
            Logger.logError('Unknown ShareJS document error', {
              error: {
                error: docError
              }
            });
            return Status.CONNECTION_ERROR;
          } else if (sys.archivedVersion) {
            return Status.ARCHIVED;
          } else if (sys.deletedVersion) {
            return Status.DELETED;
          } else {
            return Status.OK;
          }
        }
      );
    } else {
      return K.constant(Status.NOT_ALLOWED);
    }
  }
}]);
