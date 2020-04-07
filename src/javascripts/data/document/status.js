import * as K from 'utils/kefir';
import DocumentStatusCode from 'data/document/statusCode';
import * as logger from 'services/logger';
import { Error as DocError } from './Error';

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
 * @param {K.Property<string? | Error>} docError$
 * @param {boolean} canUpdate
 * @returns {K.Property<string>}
 */
export function create(sys$, docError$, canUpdate) {
  return K.combineProperties([sys$, docError$], (sys, docError) => {
    // CmaDocument specific errors.
    if (docError instanceof DocError.CmaInternalServerError) {
      logger.logServerError('CMADocument error', { error: { error: docError } });
      return DocumentStatusCode.INTERNAL_SERVER_ERROR;
    }
    if (docError instanceof DocError.VersionMismatch) {
      return DocumentStatusCode.EDIT_CONFLICT;
    }
    if (docError instanceof DocError.ShareJsInternalServerError || docError === 'internal-server-error') {
      logger.logSharejsError('Internal server error', { error: { error: docError } });
      return DocumentStatusCode.INTERNAL_SERVER_ERROR;
    }
    if (!canUpdate || docError instanceof DocError.OpenForbidden) {
      return DocumentStatusCode.NOT_ALLOWED;
    }
    if (docError instanceof DocError.Disconnected) {
      return DocumentStatusCode.CONNECTION_ERROR;
    }
    if (docError) {
      logger.logSharejsError('Unknown ShareJS document error', { error: { error: docError } });
      return DocumentStatusCode.CONNECTION_ERROR;
    }
    if (sys.archivedVersion) {
      return DocumentStatusCode.ARCHIVED;
    }
    if (sys.deletedVersion) {
      return DocumentStatusCode.DELETED;
    }
    return DocumentStatusCode.OK;
  });
}
