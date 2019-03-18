import _ from 'lodash';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';

export async function fetchContentTypes(widgetAPI) {
  const contentTypes = await widgetAPI.space.getContentTypes();
  return _.uniqBy(contentTypes.items, contentType => contentType.name);
}

export async function fetchEntries(widgetAPI, contentType) {
  const entries = await widgetAPI.space.getEntries({ content_type: contentType.sys.id });

  return entries.items.map(entry => {
    return {
      contentTypeName: contentType.name,
      displayTitle: entry.fields[contentType.displayField]
        ? entry.fields[contentType.displayField][widgetAPI.field.locale]
        : 'Untitled',
      id: entry.sys.contentType.sys.id,
      entry
    };
  });
}

export const richTextCommandsFeatureFlag = {
  isEnabled: () => getCurrentVariation('feature-03-2019-richt-text-commands')
};
