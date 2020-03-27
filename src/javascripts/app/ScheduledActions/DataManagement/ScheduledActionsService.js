import { SCHEDULED_JOBS, getAlphaHeader } from 'alphaHeaders.js';

const ALPHA_HEADER = getAlphaHeader(SCHEDULED_JOBS);

export function createJob(endpoint, jobDto, query) {
  return endpoint(
    {
      method: 'POST',
      data: jobDto,
      path: ['scheduled_actions'],
      query,
    },
    ALPHA_HEADER
  );
}

export function getJobs(endpoint, query) {
  return endpoint(
    {
      method: 'GET',
      path: ['scheduled_actions'],
      query,
    },
    ALPHA_HEADER
  );
}

export async function getNotCanceledJobsForEntity(endpoint, entityId, query) {
  const { items } = await getJobs(endpoint, {
    'entity.sys.id': entityId,
    order: '-scheduledFor.datetime',
    ...query,
  });

  // TODO: remove after implementing status filter in the api
  return items.filter((j) => j.sys.status !== 'canceled');
}

export function cancelJob(endpoint, jobId, query) {
  return endpoint(
    {
      method: 'DELETE',
      path: ['scheduled_actions', jobId],
      query,
    },
    ALPHA_HEADER
  );
}
