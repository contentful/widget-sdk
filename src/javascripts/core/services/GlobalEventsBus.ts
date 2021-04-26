import mitt from 'mitt';

export const GlobalEventBus = mitt();

export const GlobalEvents = {
  RefreshPublishedContentTypes: 'space-context:published-content-types:refresh',
};
