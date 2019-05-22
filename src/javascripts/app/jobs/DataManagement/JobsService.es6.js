const ALPHA_HEADER = {
  'x-contentful-enable-alpha-feature': 'jobs'
};

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

export function getJobsWithEntryId(endpoint, entryId) {
  return getJobs(endpoint, {
    'sys.entity.sys.id': entryId
  });
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
