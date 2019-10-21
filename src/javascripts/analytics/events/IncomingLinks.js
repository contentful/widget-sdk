import { track } from 'analytics/Analytics.es6';

export const Origin = {
  DIALOG: 'dialog',
  SIDEBAR: 'sidebar'
};

export function onIncomingLinkClick({
  entityId,
  entityType,
  incomingLinksCount,
  origin,
  linkEntityId,
  dialogAction,
  dialogSessionId
}) {
  const defaults = {
    entity_id: entityId,
    entity_type: entityType,
    link_entity_id: linkEntityId,
    incoming_links_count: incomingLinksCount
  };
  let options;
  if (origin === Origin.DIALOG) {
    options = {
      ...defaults,
      dialog_action: dialogAction,
      dialog_session_id: dialogSessionId
    };
  } else {
    options = defaults;
  }
  track(
    // incoming_links:dialog_link_click
    // incoming_links:sidebar_link_click
    `incoming_links:${origin}_link_click`,
    options
  );
}

export function onDialogOpen(options) {
  trackDialogEvent('open', options);
}

export function onDialogConfirm(options) {
  trackDialogEvent('confirm', options);
}

export function onFetchLinks({ entityId, entityType, incomingLinksCount }) {
  track('incoming_links:query', {
    entity_id: entityId,
    entity_type: entityType,
    incoming_links_count: incomingLinksCount
  });
}

function trackDialogEvent(
  type,
  { entityId, entityType, incomingLinksCount, dialogAction, dialogSessionId }
) {
  track(
    // incoming_links:dialog_open
    // incoming_links:dialog_confirm
    `incoming_links:dialog_${type}`,
    {
      entity_id: entityId,
      entity_type: entityType,
      dialog_action: dialogAction,
      dialog_session_id: dialogSessionId,
      incoming_links_count: incomingLinksCount
    }
  );
}
