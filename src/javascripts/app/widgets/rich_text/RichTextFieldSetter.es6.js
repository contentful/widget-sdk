import $q from '$q';
import * as ShareJS from 'data/ShareJS/Utils';
import logger from 'logger';
import jsondiff from 'json0-ot-diff';
import diffMatchPatch from 'diff-match-patch';
import emptyDoc from './constants/EmptyDoc.es6';

/**
 * @description
 *  Verifies if the field matching `fieldId` is
 * a structured text field in the given content type.
 *
 * @name RichTextField#is
 * @param {string} fieldId
 * @param {object} contentType
 *
 * @returns {boolean}
 */
export const is = (fieldId, contentType) => {
  if (!contentType) {
    return false;
  }
  const fields = contentType.data ? contentType.data.fields : contentType.fields;
  const field = fields.find(f => f.id === fieldId);
  return field && field.type === 'RichText';
};

/**
 * @description
 * Sets the structured text value of a field at `fieldPath` in a given `doc`
 * and sends it to ShareJS.
 * If the field has no value, it initializes it with an empty
 * document.
 *
 * @param {otDoc} doc
 * @param {array} fieldPath
 * @param {object} nextFieldValue
 */
export const setAt = (doc, fieldPath, nextFieldValue) => {
  const fieldValue = ShareJS.peek(doc, fieldPath);
  if (fieldValue === undefined) {
    return ShareJS.setDeep(doc, fieldPath, emptyDoc).then(() =>
      setValue(doc, fieldPath, emptyDoc, nextFieldValue)
    );
  }

  return setValue(doc, fieldPath, fieldValue, nextFieldValue);
};

function setValue(doc, fieldPath, fieldValue, nextFieldValue) {
  const ops = jsondiff(fieldValue, nextFieldValue, diffMatchPatch).map(op => ({
    ...op,
    p: [...fieldPath, ...op.p]
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
    return ShareJS.setDeep(doc, fieldPath, nextFieldValue);
  }

  return $q.denodeify(cb => {
    try {
      doc.submitOp(ops, cb);
    } catch (e) {
      logger.logException(e);
    }
  });
}
