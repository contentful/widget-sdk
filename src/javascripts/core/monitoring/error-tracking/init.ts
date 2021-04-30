import type { Event, EventHint } from '@contentful/experience-error-tracking';
import { init, Severity } from '@contentful/experience-error-tracking';
import * as Config from 'Config';

export const initErrorTracking = () => {
  init({
    dsn: Config.services.sentry.dsn,
    release: Config.gitRevision,
    environment: Config.env,
    normalizeDepth: 10,
    ignoreErrors: ['Request failure in preflight'],
    // @ts-expect-error mute Event type is incompatible
    beforeSend: toConsole,
  });
};

const levelMapping = {
  [Severity.Error]: console.error,
  [Severity.Warning]: console.warn,
};

const toConsole = (event: Event, hint?: EventHint) => {
  if (!['production', 'jest'].includes(Config.env)) {
    const log = levelMapping[event.level || ''] ?? console.log;
    log(event, hint);
  }

  return event;
};
