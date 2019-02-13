import * as K from 'utils/kefir.es6';
import DocumentStatusCode from 'data/document/statusCode.es6';
import * as logger from 'services/logger.es6';

/**
 * @description
 * Internal factory for the 'status$' property of
 * 'app/entity_editor/Document'. See the documentation there.
 *
 * Tested in the 'app/entity_editor/Document' tests.
 */

/**
 * @description
 * Returns a property that holds one of the values from the 'DocumentStatusCode'
 * map.
 *
 * @param {K.Property<API.Entity.Sys>} sys$
 * @param {K.Property<string?>} docError$
 * @param {boolean} canUpdate
 * @returns {K.Property<string>}
 */
export function create(sys$, docError$, canUpdate, statusError$) {
  if (canUpdate) {
    return K.combineProperties([sys$, docError$, statusError$], (sys, docError, statusError) => {
      if (statusError.error === DocumentStatusCode.INTERNAL_SERVER_ERROR) {
        logger.logSharejsError('Internal server error', {
          error: {
            error: docError
          }
        });

        return DocumentStatusCode.INTERNAL_SERVER_ERROR;
      }

      if (docError === 'forbidden') {
        return DocumentStatusCode.NOT_ALLOWED;
      } else if (docError === 'disconnected') {
        logger.logSharejsError('ShareJS connection error', {
          error: {
            error: docError
          }
        });
        return DocumentStatusCode.CONNECTION_ERROR;
      } else if (docError) {
        logger.logSharejsError('Unknown ShareJS document error', {
          error: {
            error: docError
          }
        });
        return DocumentStatusCode.CONNECTION_ERROR;
      } else if (sys.archivedVersion) {
        return DocumentStatusCode.ARCHIVED;
      } else if (sys.deletedVersion) {
        return DocumentStatusCode.DELETED;
      } else {
        return DocumentStatusCode.OK;
      }
    });
  } else {
    return K.constant(DocumentStatusCode.NOT_ALLOWED);
  }
}
