import { Matchers } from '@pact-foundation/pact-web';
import {
  defaultSpaceId,
  defaultUserId,
  defaultJobId,
  defaultEnvironmentId
} from '../../util/requests';

export const severalPendingJobsResponse = {
  sys: {
    type: 'Array'
  },
  limit: 100,
  pages: {},
  items: [
    job({ sys: { id: Matchers.somethingLike(defaultJobId) } }),
    job({ sys: { id: Matchers.somethingLike('jobID2') } }),
    job({ sys: { id: Matchers.somethingLike('jobID3') } })
  ]
};

export const severalCompletedJobsResponse = {
  sys: {
    type: 'Array'
  },
  limit: 100,
  pages: {},
  items: [
    job({ sys: { id: Matchers.somethingLike('jobID3'), status: 'succeeded' } }),
    job({ sys: { id: Matchers.somethingLike('jobID4'), status: 'succeeded' } })
  ]
};
export const severalFailedJobsResponse = {
  sys: {
    type: 'Array'
  },
  limit: 100,
  pages: {},
  items: [
    job({ sys: { id: Matchers.somethingLike('jobID5'), status: 'failed' } }),
    job({ sys: { id: Matchers.somethingLike('jobID6'), status: 'failed' } })
  ]
};

export const onePendingJobResponse = {
  sys: {
    type: 'Array'
  },
  limit: 100,
  pages: {},
  items: [job({ sys: { id: Matchers.somethingLike(defaultJobId) } })]
};

export const oneFailedJobResponse = {
  sys: {
    type: 'Array'
  },
  limit: 100,
  pages: {},
  items: [job({ sys: { id: Matchers.somethingLike(defaultJobId), status: 'failed' } })]
};

export const createJobResponse = job({
  sys: {
    id: Matchers.somethingLike('3A13SXSDwO8c46NrjigFYT'),
    space: { sys: { type: 'Link', id: defaultSpaceId } },
    createdBy: { sys: { type: 'Link', id: defaultUserId } }
  }
});

export function job(jobPayload = { sys: {} }) {
  const sys = {
    id: 'jobID',
    type: 'ScheduledAction',
    createdAt: Matchers.iso8601DateTimeWithMillis('2119-09-02T13:00:00.000Z'),
    createdBy: {
      sys: {
        id: 'userID',
        linkType: 'User',
        type: 'Link'
      }
    },
    space: {
      sys: {
        id: defaultSpaceId,
        linkType: 'Space',
        type: 'Link'
      }
    },
    status: 'scheduled',
    ...jobPayload.sys
  };
  const entity = {
    sys: {
      type: 'Link',
      linkType: 'Entry',
      id: 'testEntryId'
    }
  };
  const environment = {
    sys: {
      type: 'Link',
      linkType: 'Environment',
      id: defaultEnvironmentId
    }
  };
  return {
    sys,
    entity,
    environment,
    scheduledFor: {
      datetime: Matchers.iso8601DateTimeWithMillis('2119-09-02T14:00:00.000Z')
    },
    action: 'publish'
  };
}
