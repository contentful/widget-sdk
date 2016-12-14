angular.module('contentful')

/**
 * @ngdoc service
 * @name data/Document/Status
 * @description
 * Internal factory for the 'status$' property of
 * 'entityEditor/Document'
 *
 * Tested in the 'entityEditor/Document' tests.
 */
.factory('data/Document/Status', ['require', function (require) {
  var K = require('utils/kefir');

  var Status = {
    NOT_ALLOWED: 'editing-not-allowed',
    CONNECTION_ERROR: 'ot-connection-error',
    ARCHIVED: 'archived',
    OK: 'ok'
  };

  return {
    create: create,
    Status: Status
  };

  function create (sys$, hasDocError$, canUpdate) {
    if (canUpdate) {
      return K.combine(
        [sys$, hasDocError$],
        function (sys, hasDocError) {
          if (hasDocError) {
            return Status.CONNECTION_ERROR;
          } else if (isArchived(sys)) {
            return Status.ARCHIVED;
          } else {
            return Status.OK;
          }
        }
      );
    } else {
      return K.constant(Status.NOT_ALLOWED);
    }
  }

  function isArchived (sys) {
    return sys.archivedVersion;
  }
}]);
