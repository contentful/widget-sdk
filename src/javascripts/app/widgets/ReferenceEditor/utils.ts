import noop from 'lodash/noop';
import get from 'lodash/get';
import { track } from 'analytics/Analytics';
import { WidgetApi } from 'widgets/BuiltinWidgets';
import { EventData } from 'analytics/types';

export function trackReferenceAction(eventName: string, action: any, sdk: WidgetApi) {
  const eventData: EventData = {
    parentEntryId: sdk.entry.getSys().id,
    parentFieldPath: [sdk.field.id, sdk.field.locale],
    entityType: action.entity,
    // We get action.id and .contentTypeId instead of action.entityData in case of "delete" action.
    entityId: action.id || get(action, 'entityData.sys.id'),
    ctId: action.contentTypeId || get(action, 'entityData.sys.contentType.sys.id') || null,
  };
  safeNonBlockingTrack(eventName, eventData);
}

export function safeNonBlockingTrack(eventName: string, eventData: EventData) {
  // @ts-expect-error requestIdleCallback was added to window object
  const queueFn = window.requestIdleCallback || window.requestAnimationFrame || noop;
  queueFn(() => {
    try {
      track(eventName, eventData);
    } catch (e) {
      // do nothing
    }
  });
}
