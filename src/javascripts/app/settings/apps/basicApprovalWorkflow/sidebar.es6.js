import * as Random from 'utils/Random.es6';

// These are frontend safe credentials.
const PUB_NUB_PUBLISH_KEY = 'pub-c-2833dbe8-4b9e-4bc0-867b-461f92e79b62';
const PUB_NUB_SUBSCRIBE_KEY = 'sub-c-9a60f380-3a70-11e9-b682-2a55d2175413';

export default function makeSidebar(extensionId, webhookUrl) {
  return [
    {
      widgetId: extensionId,
      widgetNamespace: 'extension',
      settings: {
        publishKey: PUB_NUB_PUBLISH_KEY,
        subscribeKey: PUB_NUB_SUBSCRIBE_KEY,
        channelPrefix: Random.id(),
        webhookUrl
      }
    },
    {
      widgetId: 'translation-widget',
      widgetNamespace: 'sidebar-builtin'
    },
    {
      widgetId: 'incoming-links-widget',
      widgetNamespace: 'sidebar-builtin'
    },
    {
      widgetId: 'content-preview-widget',
      widgetNamespace: 'sidebar-builtin'
    },
    {
      disabled: true,
      widgetId: 'publication-widget',
      widgetNamespace: 'sidebar-builtin'
    },
    {
      disabled: true,
      widgetId: 'versions-widget',
      widgetNamespace: 'sidebar-builtin'
    },
    {
      disabled: true,
      widgetId: 'users-widget',
      widgetNamespace: 'sidebar-builtin'
    }
  ];
}
