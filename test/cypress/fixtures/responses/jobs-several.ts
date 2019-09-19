import { Matchers } from '@pact-foundation/pact-web';
import { defaultSpaceId, defaultUserId, defaultJobId } from '../../util/requests';

export const severalPendingJobsResponse = {
  sys: {
    type: 'Array'
  },
  skip: 0,
  limit: 100,
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
  skip: 0,
  limit: 100,
  items: [
    job({ sys: { id: Matchers.somethingLike('jobID3'), status: 'done' } }),
    job({ sys: { id: Matchers.somethingLike('jobID4'), status: 'done' } })
  ]
};
export const severalFailedJobsResponse = {
  sys: {
    type: 'Array'
  },
  skip: 0,
  limit: 100,
  items: [
    job({ sys: { id: Matchers.somethingLike('jobID5'), status: 'failed' } }),
    job({ sys: { id: Matchers.somethingLike('jobID6'), status: 'failed' } })
  ]
};

export const onePendingJobResponse = {
  sys: {
    type: 'Array'
  },
  skip: 0,
  limit: 100,
  items: [job({ sys: { id: Matchers.somethingLike(defaultJobId) } })]
};

export const oneFailedJobResponse = {
  sys: {
    type: 'Array'
  },
  skip: 0,
  limit: 100,
  items: [job({ sys: { id: Matchers.somethingLike(defaultJobId), status: 'failed' } })]
};

export const createJobResponse = job({
  sys: {
    id: Matchers.somethingLike('3A13SXSDwO8c46NrjigFYT'),
    environment: { sys: { type: 'Link', id: 'master' } },
    space: { sys: { type: 'Link', id: defaultSpaceId } },
    scheduledBy: { sys: { type: 'Link', id: defaultUserId } }
  }
});

export function job(jobPayload = { sys: {} }) {
  const sys = {
    id: 'jobID',
    scheduledBy: {
      sys: {
        id: 'userID'
      }
    },
    entity: {
      sys: {
        type: 'Link',
        linkType: 'Entry',
        id: 'testEntryId'
      }
    },
    status: 'pending',
    ...jobPayload.sys
  };
  return {
    sys,
    scheduledAt: Matchers.iso8601DateTimeWithMillis('2119-09-02T14:00:00.000Z'),
    action: 'publish'
  };
}
