import _ from 'lodash';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';

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
