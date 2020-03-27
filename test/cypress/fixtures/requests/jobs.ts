// import { defaultSpaceId, defaultUserId } from '../../util/requests';
import { Matchers } from '@pact-foundation/pact-web';

export const createJobRequest = {
  entity: { sys: { type: 'Link', linkType: 'Entry', id: 'testEntryId' } },
  environment: { sys: { type: 'Link', id: 'master', linkType: 'Environment' } },
  scheduledFor: {
    datetime: Matchers.iso8601DateTimeWithMillis('2119-09-02T16:00:00.000+02:00'),
  },
  action: 'publish',
};
