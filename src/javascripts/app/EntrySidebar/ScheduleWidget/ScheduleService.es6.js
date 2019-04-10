const ALPHA_HEADER = {
  'x-contentful-enable-alpha-feature': 'scheduled-actions'
};

export function createSchedule(endpoint, entryId, scheduleDto) {
  return endpoint(
    {
      method: 'POST',
      data: scheduleDto,
      path: ['entries', entryId, 'schedules']
    },
    ALPHA_HEADER
  );
}

export function getSchedulesWithEntryId(endpoint, entryId) {
  return endpoint(
    {
      method: 'GET',
      path: ['entries', entryId, 'schedules']
    },
    ALPHA_HEADER
  );
}
