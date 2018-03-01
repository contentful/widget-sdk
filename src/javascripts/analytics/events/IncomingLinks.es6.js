import { track } from 'analytics/Analytics';

export const Origin = {
  DIALOG: 'dialog',
  SIDEBAR: 'sidebar'
};

export function onIncomingLinkClick ({
  entityId,
  entityType,
  incomingLinksCount,
  origin,
  linkEntityId,
  sessionId
}) {
  const defaults = {
    entity_id: entityId,
    entity_type: entityType,
    link_entity_id: linkEntityId,
    incoming_links_count: incomingLinksCount
  };
  const options = origin === Origin.DIALOG && sessionId
    ? { ...defaults, dialog_session_id: sessionId }
    : defaults;
  track(
    // incoming_links:dialog_link_click
    // incoming_links:sidebar_link_click
    `incoming_links:${origin}_link_click`,
    options
  );
}

export function onDialogOpen (options) {
  trackDialogEvent('open', options);
}

export function onDialogConfirm (options) {
  trackDialogEvent('confirm', options);
}

export function onFetchLinks ({
  entityId,
  entityType,
  incomingLinksCount
}) {
  track('incoming_links:query', {
    entity_id: entityId,
    entity_type: entityType,
    incoming_links_count: incomingLinksCount
  });
}

function trackDialogEvent (type, {
  entityId,
  entityType,
  incomingLinksCount,
  sessionId
}) {
  track(
    // incoming_links:dialog_open
    // incoming_links:dialog_confirm
    `incoming_links:dialog_${type}`,
    {
      entity_id: entityId,
      entity_type: entityType,
      dialog_session_id: sessionId,
      incoming_links_count: incomingLinksCount
    }
  );
}
