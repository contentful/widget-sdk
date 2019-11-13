import _ from 'lodash';

export function getFieldValue({
  /**
   * Expects an entity fetched with a flag Skip-Transformation: true
   */
  entity,
  internalFieldId,
  internalLocaleCode,
  defaultInternalLocaleCode
}) {
  const values = _.get(entity, ['fields', internalFieldId]);
  if (!_.isObject(values)) {
    return;
  }

  const firstLocaleCode = Object.keys(values)[0];

  return values[internalLocaleCode] || values[defaultInternalLocaleCode] || values[firstLocaleCode];
}

export function getAssetTitle({
  /**
   * Expects an entity fetched with a flag Skip-Transformation: true
   */
  asset,
  internalLocaleCode,
  defaultInternalLocaleCode,
  defaultTitle
}) {
  const title = getFieldValue({
    entity: asset,
    internalFieldId: 'title',
    internalLocaleCode,
    defaultInternalLocaleCode
  });
  return titleOrDefault(title, defaultTitle);
}

export function getEntryTitle({
  /**
   * Expects an entity fetched with a flag Skip-Transformation: true
   */
  entry,
  contentType,
  internalLocaleCode,
  defaultInternalLocaleCode,
  defaultTitle
}) {
  let title;
  if (!contentType) {
    return defaultTitle;
  }
  const displayField = contentType.displayField;
  if (!displayField) {
    return defaultTitle;
  } else {
    // when localization for a field is "turned off",
    // we don't clean up the "old" localized data, so it is still in the response.
    // Therefore, we're checking if displayField is localizable.
    const displayFieldInfo = _.find(contentType.fields, { id: displayField });

    if (displayFieldInfo.localized) {
      title = getFieldValue({
        entity: entry,
        internalFieldId: displayField,
        internalLocaleCode,
        defaultInternalLocaleCode
      });
    } else {
      title = getFieldValue({
        entity: entry,
        internalFieldId: displayField,
        defaultInternalLocaleCode
      });
    }

    return titleOrDefault(title, defaultTitle);
  }
}

function titleOrDefault(title, defaultTitle) {
  if (!title || title.match(/^\s*$/)) {
    return defaultTitle;
  } else {
    return title;
  }
}
