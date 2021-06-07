import { init, Integrations } from '@contentful/experience-error-tracking';
import * as Config from 'Config';

export const initErrorTracking = () => {
  init({
    dsn: Config.services.sentry.dsn,
    release: Config.gitRevision,
    environment: Config.env,
    normalizeDepth: 10,
    integrations: (integrations) => {
      if (!['production', 'jest'].includes(Config.env)) {
        return [...integrations, new Integrations.Debug()];
      }

      return integrations;
    },
    beforeSend: (event, hint) => {
      // @ts-expect-error we don't need extensive checks here
      if (hint?.originalException?.__isSilent) {
        return null;
      }

      return event;
    },
  });
};
