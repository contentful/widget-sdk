import { pick } from 'lodash';

/*
 * Return the public representation of a Content Type from the
 * internal one.
 *
 * The internal represenation is received from the API when the
 * 'X-Contentful-Skip-Transformation' header is set or from ShareJS.
 * The public one is received from the API without the header.
 */
export function fromInternal(data) {
  const result = pick(data, ['sys', 'name', 'description']);

  // Find the display field.
  const displayField = (data.fields || []).find(field => field.id === data.displayField);
  if (displayField) {
    // Use the `apiName` (public ID) if possible.
    result.displayField = displayField.apiName || displayField.id;
  }

  // Copy and rewrite all fields.
  result.fields = (data.fields || []).map(field => {
    // Use the `apiName` (public ID) if possible.
    const rewritten = { ...field, id: field.apiName || field.id };
    // Don't expose the `apiName`.
    delete rewritten.apiName;
    return rewritten;
  });

  return result;
}
