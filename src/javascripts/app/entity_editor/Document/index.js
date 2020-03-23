import * as PathUtils from 'utils/Path';
import * as Status from 'data/document/status';
import * as accessChecker from 'access_control/AccessChecker';

export { create as createOtDoc } from './OtDocument';
export { create as createCmaDoc } from './CmaDocument';

/**
 * @description
 * Returns a property that always has the current value at the given
 * path of the document.
 *
 * @param {EntityDocument} document
 * @param {string[]} path
 * @returns {kefir.Property<any>}
 */
export function valuePropertyAt(document, path) {
  return document.changes
    .filter(changePath => PathUtils.isAffecting(changePath, path))
    .toProperty(() => undefined)
    .map(() => document.getValueAt(path));
}

/**
 * A stream of `[fieldName, locale]` pairs for locally changed fields.
 *
 * @param {EntityDocument} document
 * @returns {Stream<[string, string]>}
 */
export function localFieldChanges(document) {
  return document.changes
    .filter(path => path.length >= 3 && path[0] === 'fields')
    .map(path => [path[1], path[2]]);
}

/**
 * @description
 * Current status of the document
 *
 * Is one of
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
    document.state.error$.toProperty(() => null),
    accessChecker.canUpdateEntity({ data: document.getValueAt([]) })
  );
}
