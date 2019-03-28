import _ from 'lodash';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import { isNodeTypeEnabled } from 'app/widgets/rich_text/validations/index.es6';
import { can, canCreateAsset } from 'access_control/AccessChecker/index.es6';
import { INLINES, BLOCKS } from '@contentful/rich-text-types';

export async function fetchContentTypes(widgetAPI) {
  const contentTypes = await widgetAPI.space.getContentTypes();
  return _.uniqBy(contentTypes.items, contentType => contentType.name);
}

export async function fetchAssets(widgetAPI) {
  const assets = await widgetAPI.space.getAssets();
  return assets.items.map(asset => ({
    contentTypeName: 'Asset',
    displayTitle: asset.fields.title ? asset.fields.title[widgetAPI.field.locale] : 'Untitled',
    id: asset.sys.id,
    entry: asset
  }));
}

export async function fetchEntries(widgetAPI, contentType, query = '') {
  const entries = await widgetAPI.space.getEntries({
    content_type: contentType.sys.id,
    query
  });

  return entries.items.map(entry => ({
    contentTypeName: contentType.name,
    displayTitle: entry.fields[contentType.displayField]
      ? entry.fields[contentType.displayField][widgetAPI.field.locale]
      : 'Untitled',
    id: entry.sys.contentType.sys.id,
    entry
  }));
}

export const richTextCommandsFeatureFlag = {
  isEnabled: () => getCurrentVariation('feature-03-2019-richt-text-commands')
};

/**
 * @description
 * Checks the field validations if the current content type is valid to be linked/embedded.
 *
 * @param {Object} field
 * @param {Object} contentType
 * @param {String} embedType
 * @returns {Boolean}
 */
export const isValidLinkedContentType = (field, contentType, embedType) => {
  if (field.validations.length === 0) {
    return true;
  }

  const nodes = field.validations.filter(val => val.nodes)[0].nodes;

  if (nodes[embedType] === undefined) {
    return true;
  }

  return !!nodes[embedType]
    .filter(typeVal => typeVal.linkContentType)
    .reduce((pre, cur) => [...pre, cur.linkContentType], [])
    .reduce((pre, cur) => [...pre, ...cur], [])
    .find(ct => ct === contentType.sys.id);
};

export const createActionIfAllowed = (
  field,
  contentType,
  embedType,
  isCreateAndEmbed,
  callback
) => {
  const isAsset = embedType === BLOCKS.EMBEDDED_ASSET;
  const isInline = embedType === INLINES.EMBEDDED_ENTRY;
  if (!isNodeTypeEnabled(field, embedType)) {
    return false;
  }

  if (isAsset) {
    if (isCreateAndEmbed && !canCreateAsset()) {
      return false;
    }
  } else {
    if (!isValidLinkedContentType(field, contentType, embedType)) {
      return false;
    }

    if (isCreateAndEmbed && !can('create', contentType)) {
      return false;
    }
  }

  const label = `${isCreateAndEmbed ? 'Create and add' : 'Add'} ${
    isAsset ? 'Asset' : contentType.name
  } ${isInline ? ' - Inline' : ''}`;

  const icon = isInline ? 'EmbeddedEntryInline' : 'EmbeddedEntryBlock';

  return {
    label,
    group: isAsset ? 'Assets' : contentType.name,
    callback,
    icon
  };
};
