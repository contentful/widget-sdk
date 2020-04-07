import * as PathUtils from 'utils/Path';

/**
 * Returns a property that always has the current value at the given
 * path of the document.
 *
 * @param {Document} document
 * @param {string[]} path
 * @returns {Kefir.Property<any, any>}
 */
export function valuePropertyAt(document, path) {
  return document.changes
    .filter((changePath) => PathUtils.isAffecting(changePath, path))
    .toProperty(() => undefined)
    .map(() => document.getValueAt(path));
}

/**
 * A stream of `[fieldName, locale]` pairs for locally changed fields.
 *
 * @param {Document} document
 * @returns {Kefir.Stream<[string, string]>}
 */
export function localFieldChanges(document) {
  return document.changes
    .filter((path) => path.length >= 3 && path[0] === 'fields')
    .map((path) => [path[1], path[2]]);
}
