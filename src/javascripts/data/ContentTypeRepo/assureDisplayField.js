const isDisplayField = field => ['Symbol', 'Text'].includes(field.type) && !field.disabled;

/*
 * Mutate the Content Type data so that the 'displayField' property
 * points to a valid display field.
 */
export default function assureDisplayField(contentTypeData) {
  const validDisplayField = getDisplayField(contentTypeData);

  if (typeof validDisplayField === 'string') {
    // If the display field was set before and is valid, it is retained.
    // Otherwise the first valid field is used.
    contentTypeData.displayField = validDisplayField;
  } else if (typeof contentTypeData.displayField === 'string') {
    // If there was no valid display field found but the content type
    // defines one - set it to `undefined`.
    // If the content type defines one that is not a string (e.g. `null`)
    // we don't do anything so the editor won't enter dirty state.
    contentTypeData.displayField = undefined;
  }
}

/**
 * Returns true if the `displayField` property of a Content Type points
 * to an existing field in the Content Type and its type is either
 * `Symbol` or `Text`.
 */
function hasValidDisplayField(contentTypeData) {
  const displayField = contentTypeData.displayField;
  return (contentTypeData.fields || []).some(field => {
    return displayField === field.id && isDisplayField(field);
  });
}

/**
 * If `displayField` does not point to an existing field, return
 * the first field usable as a display field. Otherwise returns
 * the display field.
 */
function getDisplayField(contentTypeData) {
  if (hasValidDisplayField(contentTypeData)) {
    return contentTypeData.displayField;
  } else {
    return findFieldUsableAsTitle(contentTypeData.fields);
  }
}

/**
 * Returns the ID of the first field that can be used as the
 * `displayField`. That is a `Symbol` or `Text` fields that are not
 * disabled. Returns `undefined` if no display field candidate was found.
 */
function findFieldUsableAsTitle(fields) {
  return (fields || []).filter(isDisplayField).map(field => field.id)[0];
}
