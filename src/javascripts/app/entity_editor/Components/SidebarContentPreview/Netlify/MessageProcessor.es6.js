export const EVENT_TRIGGERED = 'triggered';
export const EVENT_TRIGGER_FAILED = 'trigger-failed';

const CONTENTFUL_EVENTS = [EVENT_TRIGGERED, EVENT_TRIGGER_FAILED];

const EVENT_BUILD_STARTED = 'build-started';
const EVENT_BUILD_READY = 'build-ready';
const EVENT_BUILD_FAILED = 'build-failed';

const NETLIFY_EVENTS = [EVENT_BUILD_STARTED, EVENT_BUILD_READY, EVENT_BUILD_FAILED];

const NETLIFY_STATE_TO_EVENT = {
  uploaded: EVENT_BUILD_STARTED,
  building: EVENT_BUILD_STARTED,
  ready: EVENT_BUILD_READY,
  error: EVENT_BUILD_FAILED
};

function isValidNetlifyMessage(msg, siteId) {
  return msg.site_id === siteId && NETLIFY_STATE_TO_EVENT[msg.state];
}

function normalizeNetlifyMessage(msg, siteId) {
  const event = NETLIFY_STATE_TO_EVENT[msg.state];

  return {
    event,
    siteId,
    buildId: msg.id,
    error: msg.error_message
  };
}

function isValidContentfulMessage(msg) {
  return msg.contentful && CONTENTFUL_EVENTS.includes(msg.event);
}

function normalizeContentfulMessage(msg, users) {
  const user = (users || []).find(u => u.sys.id === msg.userId);
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null;

  const normalized = { ...msg, userName };
  delete normalized.contentful;

  return normalized;
}

export function normalizeMessage(netlifySiteId, users, msg) {
  if (isValidNetlifyMessage(msg, netlifySiteId)) {
    return normalizeNetlifyMessage(msg, netlifySiteId);
  }

  if (isValidContentfulMessage(msg)) {
    return normalizeContentfulMessage(msg, users);
  }

  return null;
}

export function isOutOfOrder(msg, previousMessages) {
  if (msg.event !== EVENT_BUILD_STARTED) {
    return false;
  }

  return !!previousMessages.find(({ event, buildId }) => {
    const doneAlready = [EVENT_BUILD_FAILED, EVENT_BUILD_READY].includes(event);
    const sameBuild = buildId === msg.buildId;
    return doneAlready && sameBuild;
  });
}

export function isDuplicate(msg, previousMessages) {
  if (!NETLIFY_EVENTS.includes(msg.event)) {
    return false;
  }

  return !!previousMessages.find(({ event, buildId }) => {
    return event === msg.event && buildId === msg.buildId;
  });
}
