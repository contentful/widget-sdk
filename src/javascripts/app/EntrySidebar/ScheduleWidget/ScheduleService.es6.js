const createMockSchedule = () => ({
  scheduledAt: '2019-11-14T16:36:36.850Z',
  actionType: 'publish',
  status: 'pending'
});
const createMockCollectionResponse = items => {
  return {
    items,
    limit: 1000,
    skip: 0,
    sys: { type: 'Array' },
    total: items.length
  };
};

export function getSchedulesWithEntryId(_entryId) {
  return new Promise(res => {
    setTimeout(() => {
      res(createMockCollectionResponse([createMockSchedule()]));
    }, 1000);
  });
}
