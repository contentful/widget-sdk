import jsondiff from 'json0-ot-diff';
import { EMPTY_DOCUMENT } from '@contentful/rich-text-types';
import deepEqual from 'fast-deep-equal';
import * as ShareJS from 'data/sharejs/utils';

import * as logger from 'services/logger';

const FIELD_LOCALE_PATH_LENGTH = ['fields', 'fieldId', 'localeId'].length;

/**
 * @description
 * Returns `true` if the field matching `fieldId` is a rich text field in the given
 * content type.
 *
 * @param {string} fieldId
 * @param {object} contentType
 * @returns {boolean}
 */
export const is = (fieldId, contentType) => {
  if (!contentType) {
    return false;
  }
  const fields = contentType.data ? contentType.data.fields : contentType.fields;
  const field = fields.find((f) => f.id === fieldId);
  return field && field.type === 'RichText';
};

/**
 * @description
 * Sets the structured text value of a field at `path` in a given `doc` and sends it
 * to ShareJS.
 *
 * @param {otDoc} doc
 * @param {array} path
 * @param {object} newValue
 */
export function setAt(doc, path, newValue) {
  const oldValue = ShareJS.peek(doc, path);

  if (path.length === FIELD_LOCALE_PATH_LENGTH && deepEqual(newValue, EMPTY_DOCUMENT)) {
    // NOTE: This is legacy Rich Text editor behavior. The `field-editors` version
    // of Rich Text takes care of this logic an never sends `EMPTY_DOCUMENT`,
    // instead it sends `undefined` directly.
    // This allows the RT editor to avoid unexpected `widgetApi.field.onValuChange(cb)`
    // unanticipated behavior where `cb` would be called with `undefined`
    // rather than `EMPTY_DOCUMENT`.
    //
    // When the editor state displays an empty document, we need to reset the
    // ShareJS field value to `undefined` as this is generally considered the "empty"
    // field state by the CMA. This ensures that the "required" validation is
    // triggered and is consistent with Text/Symbol type fields where '' is considered
    // as `undefined` (see `./StringFieldSetter.js`)
    if (oldValue === undefined) {
      return Promise.resolve(oldValue);
    } else {
      return ShareJS.setDeep(doc, path, undefined);
    }
  }

  if (oldValue === undefined) {
    // Set initial value after empty document state. No point in calling
    // `setValueViaOps` as this would just result in an op doing the same.
    return ShareJS.setDeep(doc, path, newValue);
  }

  return setValueViaOps(doc, path, oldValue, newValue);
}

/**
 * Calculates the minimum required (as per our algorithm) OT operations to set
 * the document to the new `nextFieldValue` and applies them to the document
 * (doc.submitOp) without simply overwriting the document completely (doc.setDeep).
 * This allows to e.g. only touch the paragraph the user has been writing in. So in
 * theory, if another user is editing another paragraph at the same time, both users
 * changes will sustain.
 * If two users would be editing the same paragraph, this would most likely create a
 * mess, which is why we have implemented the field locking on Rich Text fields to
 * ensure only one user is editing the document at the same time.
 */
function setValueViaOps(doc, path, oldValue, newValue) {
  const ops = jsondiff(oldValue, newValue).map((op) => ({
    ...op,
    p: [...path, ...op.p],
  }));

  // The initial implementation of the Rich Text contained a bug that
  // set empty document with missing `data` property in root document and
  // text node.
  // @contentful/contentful-slatejs-adapter amends the document (adding `data` property)
  // which would result in an operation that first adds the properties, then the new user
  // input.
  // The next block of code checks for operations that add the missing `data` property to the
  // root node, assuming this is an operation resulting from the adapter amending the document.
  // If that's the case, we set the whole document and not only deltas because Sharejs would
  // reject any operations based on the buggy empty document.
  const isAmendingRootNode = ({ p }) => p.length === 4 && p[3] === 'data';
  const hasMissingDataFields = ops.some(isAmendingRootNode);

  if (hasMissingDataFields) {
    logger.logWarn('Amending RichText document');
    return ShareJS.setDeep(doc, path, newValue);
  }

  return new Promise((resolve, reject) => {
    doc.submitOp(ops, (e, ...args) => {
      if (e) {
        logger.logException(e);
        reject(e);
      } else {
        resolve(...args);
      }
    });
  });
}
