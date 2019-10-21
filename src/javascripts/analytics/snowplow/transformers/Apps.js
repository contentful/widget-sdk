import { addUserOrgSpace } from './Decorators.es6';

export const AppLifecycleEventTransformer = addUserOrgSpace((_, data) => {
  return {
    data: {
      // We prefix event and app IDs with "contentful_"
      // since Snowplow already uses "event_id" and "app_id"
      // for its own operation.
      contentful_event_id: data.eventId,
      contentful_app_id: data.appId,
      app_event_name: data.eventName
    }
  };
});

export const AppUninstallationReasonTransformer = addUserOrgSpace((_, data) => {
  return {
    data: {
      // As above.
      contentful_event_id: data.eventId,
      contentful_app_id: data.appId,
      custom: data.custom,
      reason: data.reason
    }
  };
});
