// import { defaultSpaceId, defaultUserId } from '../../util/requests';
import { Matchers } from '@pact-foundation/pact-web';
import { defaultTimezone } from '../../util/requests';

export const createJobRequest = (linkType, entityId) => ({
  entity: { sys: { type: 'Link', linkType: linkType, id: entityId } },
  environment: { sys: { type: 'Link', id: 'master', linkType: 'Environment' } },
  scheduledFor: {
    datetime: Matchers.iso8601DateTimeWithMillis('2119-09-02T16:00:00.000+02:00'),
    timezone: defaultTimezone,
  },
  action: 'publish',
});
