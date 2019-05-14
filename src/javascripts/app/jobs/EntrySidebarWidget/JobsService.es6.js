const ALPHA_HEADER = {
  'x-contentful-enable-alpha-feature': 'scheduled-actions'
};

export function createJob(endpoint, entryId, jobDto) {
  return endpoint(
    {
      method: 'POST',
      data: jobDto,
      path: ['entries', entryId, 'schedules']
    },
    ALPHA_HEADER
  );
}

export function getJobsWithEntryId(endpoint, entryId) {
  return endpoint(
    {
      method: 'GET',
      path: ['entries', entryId, 'schedules']
    },
    ALPHA_HEADER
  );
}
