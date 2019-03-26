import _ from 'lodash';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import { isNodeTypeEnabled } from 'app/widgets/rich_text/validations/index.es6';
import { can, canCreateAsset } from 'access_control/AccessChecker/index.es6';
import { INLINES, BLOCKS } from '@contentful/rich-text-types';

export async function fetchContentTypes(widgetAPI) {
  const contentTypes = await widgetAPI.richTextAPI.widgetAPI.space.getContentTypes();
  return _.uniqBy(contentTypes.items, contentType => contentType.name);
}

export async function fetchAssets(widgetAPI) {
  const assets = await widgetAPI.richTextAPI.widgetAPI.space.getAssets();
  return assets.items.map(asset => ({
    contentTypeName: 'Asset',
    displayTitle: asset.fields.title
      ? asset.fields.title[widgetAPI.richTextAPI.widgetAPI.field.locale]
      : 'Untitled',
    id: asset.sys.id,
    entry: asset
  }));
}

export async function fetchEntries(widgetAPI, contentType) {
  const entries = await widgetAPI.richTextAPI.widgetAPI.space.getEntries({
    content_type: contentType.sys.id
  });

  return entries.items.map(entry => ({
    contentTypeName: contentType.name,
    displayTitle: entry.fields[contentType.displayField]
      ? entry.fields[contentType.displayField][widgetAPI.richTextAPI.widgetAPI.field.locale]
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
export const isValidLinkedContentType = (field, contentType, embedType) =>
  !!field.validations
    .map(v => {
      return (
        v.nodes &&
        v.nodes[embedType]
          .filter(typeVal => typeVal.linkContentType)
          .reduce((pre, cur) => [...pre, cur.linkContentType], [])
          .reduce((pre, cur) => [...cur, ...pre])
      );
    })
    .reduce((pre, cur) => [...cur, ...pre])
    .find(ct => ct === contentType.sys.id);

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
  } ${isInline ? ' - inline' : ''}`;

  return {
    label,
    group: isAsset ? 'Assets' : contentType.name,
    callback
  };
};
