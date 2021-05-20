import { Matchers } from '@pact-foundation/pact-web';
import {
  defaultSpaceId,
  defaultEntryId,
  defaultUserId,
  defaultJobId,
  defaultEnvironmentId,
  defaultTimezone,
} from '../../util/requests';

export const severalPendingJobsResponse = (limit: number = 40) => ({
  sys: {
    type: 'Array',
  },
  limit: limit,
  pages: {},
  items: [
    job({ sys: { id: Matchers.somethingLike(defaultJobId) } }),
    job({ sys: { id: Matchers.somethingLike('jobID2') } }),
    job({ sys: { id: Matchers.somethingLike('jobID3') } }),
  ],
});

export const severalCompletedJobsResponse = {
  sys: {
    type: 'Array',
  },
  limit: 40,
  pages: {},
  items: [
    job({ sys: { id: Matchers.somethingLike('jobID3'), status: 'succeeded' } }),
    job({ sys: { id: Matchers.somethingLike('jobID4'), status: 'succeeded' } }),
  ],
};
export const severalFailedJobsResponse = {
  sys: {
    type: 'Array',
  },
  limit: 40,
  pages: {},
  items: [
    job({ sys: { id: Matchers.somethingLike('jobID5'), status: 'failed' } }),
    job({ sys: { id: Matchers.somethingLike('jobID6'), status: 'failed' } }),
  ],
};

export const onePendingJobResponse = (linkType, entityId) => ({
  sys: {
    type: 'Array',
  },
  limit: 100,
  pages: {},
  items: [
    job({
      sys: { id: Matchers.somethingLike(defaultJobId) },
      linkType,
      entityId,
    }),
  ],
});

export const oneFailedJobResponse = (linkType, entityId) => ({
  sys: {
    type: 'Array',
  },
  limit: 100,
  pages: {},
  items: [
    job({
      sys: { id: Matchers.somethingLike(defaultJobId), status: 'failed' },
      linkType,
      entityId,
    }),
  ],
});

export const createJobResponse = (linkType, entityId) =>
  job({
    sys: {
      id: Matchers.somethingLike('3A13SXSDwO8c46NrjigFYT'),
      space: { sys: { type: 'Link', id: defaultSpaceId } },
      createdBy: { sys: { type: 'Link', id: defaultUserId } },
    },
    linkType,
    entityId,
  });

type jobPayload = {
  sys: {};
  linkType?: string;
  entityId?: string;
};

export function job({ sys: jobPayloadSys, linkType, entityId }: jobPayload) {
  const sys = {
    id: 'jobID',
    type: 'ScheduledAction',
    createdAt: Matchers.iso8601DateTimeWithMillis('2119-09-02T13:00:00.000Z'),
    createdBy: {
      sys: {
        id: '1AMbGlddLG0ISEoa1I423p',
        linkType: 'User',
        type: 'Link',
      },
    },
    space: {
      sys: {
        id: defaultSpaceId,
        linkType: 'Space',
        type: 'Link',
      },
    },
    status: 'scheduled',
    ...jobPayloadSys,
  };
  const entity = {
    sys: {
      type: 'Link',
      linkType: linkType || 'Entry',
      id: entityId || defaultEntryId,
    },
  };
  const environment = {
    sys: {
      type: 'Link',
      linkType: 'Environment',
      id: defaultEnvironmentId,
    },
  };
  return {
    sys,
    entity,
    environment,
    scheduledFor: {
      datetime: Matchers.iso8601DateTimeWithMillis('2119-09-02T14:00:00.000Z'),
      timezone: Matchers.somethingLike(defaultTimezone),
    },
    action: 'publish',
  };
}
