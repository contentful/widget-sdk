import { addUserOrgSpace } from './Decorators.es6';

export const AppLifecycleEventTransformer = addUserOrgSpace((_, data) => {
  return {
    data: {
      unique_event_id: data.uniqueEventId,
      app_id: data.appId,
      event_name: data.eventName
    }
  };
});

export const AppUninstallationReasonTransformer = addUserOrgSpace((_, data) => {
  return {
    data: {
      event_id: data.eventId,
      app_id: data.appId,
      reason: data.reason
    }
  };
});
