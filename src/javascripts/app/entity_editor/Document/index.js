import * as Status from 'data/document/status';
import * as accessChecker from 'access_control/AccessChecker';

export { valuePropertyAt, localFieldChanges } from './documentHelpers';

export { create as createOtDoc } from './OtDocument';
export { create as createCmaDoc } from './CmaDocument';

/**
 * Current status of the document
 *
 * Is one of data/document/statusCode.js codes:
 * - 'editing-not-allowed'
 * - 'ot-connection-error'
 * - 'internal-server-error'
 * - 'archived'
 * - 'ok'
 *
 * This property is used by entry_editor/StatusNotification component.
 *
 * @param {EntityDocument} document
 * @returns {kefir.Property<string>}
 */
export function statusProperty(document) {
  return Status.create(
    document.sysProperty,
    document.state.error$,
    accessChecker.canUpdateEntity({ data: document.getValueAt([]) })
  );
}
