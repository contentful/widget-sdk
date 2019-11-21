import { SCHEDULED_JOBS, getAlphaHeader } from 'alphaHeaders.js';

const ALPHA_HEADER = getAlphaHeader(SCHEDULED_JOBS);

export function createJob(endpoint, jobDto) {
  return endpoint(
    {
      method: 'POST',
      data: jobDto,
      path: ['jobs']
    },
    ALPHA_HEADER
  );
}

export function getJobs(endpoint, query) {
  return endpoint(
    {
      method: 'GET',
      path: ['jobs'],
      query
    },
    ALPHA_HEADER
  );
}

export async function getNotCanceledJobsForEntity(endpoint, entityId) {
  const { items } = await getJobs(endpoint, {
    'sys.entity.sys.id': entityId,
    order: '-sys.scheduledAt'
  });

  // TODO: remove after implementing status filter in the api
  return items.filter(j => j.sys.status !== 'canceled');
}

export function cancelJob(endpoint, jobId) {
  return endpoint(
    {
      method: 'DELETE',
      path: ['jobs', jobId]
    },
    ALPHA_HEADER
  );
}
