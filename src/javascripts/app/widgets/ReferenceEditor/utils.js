import noop from 'lodash/noop';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import { track } from 'analytics/Analytics';

export function trackReferenceAction(eventName, action, sdk) {
  const eventData = {
    parentEntryId: sdk.entry.getSys().id,
    parentFieldPath: [sdk.field.id, sdk.field.locale],
    entityType: action.entity,
    // We get action.id and .contentTypeId instead of action.entityData in case of "delete" action.
    entityId: action.id || get(action, 'entityData.sys.id'),
    ctId: action.contentTypeId || get(action, 'entityData.sys.contentType.sys.id') || null,
  };
  safeNonBlockingTrack(eventName, eventData);
}

export function safeNonBlockingTrack(...args) {
  const queueFn = window.requestIdleCallback || window.requestAnimationFrame || noop;
  queueFn(() => {
    try {
      track(...args);
    } catch (e) {
      // do nothing
    }
  });
}

export const EditorWithTrackingProps = {
  viewType: PropTypes.string.isRequired,
  sdk: PropTypes.object.isRequired,
  loadEvents: PropTypes.shape({
    emit: PropTypes.func.isRequired,
  }).isRequired,
};
