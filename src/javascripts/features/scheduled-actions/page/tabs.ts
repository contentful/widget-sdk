const TabTypes = {
  ScheduledJobs: 'ScheduledJobs',
  CompletedJobs: 'CompletedJobs',
  ErroredJobs: 'ErroredJobs',
};

const TabsData = {
  [TabTypes.ScheduledJobs]: {
    title: 'Scheduled',
    description: 'Content that is currently scheduled to publish.',
    emptyStateMessage: {
      title: 'Nothing is scheduled at the moment',
      text: 'Content that is scheduled to publish will show up here',
    },
    query: {
      'sys.status': 'scheduled',
      order: 'scheduledFor.datetime',
      limit: 40,
    },
  },
  [TabTypes.CompletedJobs]: {
    title: 'Completed',
    description: 'Content that was successfully published',
    emptyStateMessage: {
      title: 'No content has been successfully published yet',
      text: 'Successfully published content will show up here',
    },
    query: {
      'sys.status': 'succeeded',
      order: '-scheduledFor.datetime',
      limit: 40,
    },
  },
  [TabTypes.ErroredJobs]: {
    title: 'Failed',
    description: 'Content that failed to publish',
    emptyStateMessage: {
      title: 'Nothing here',
      text: 'Scheduled content that has failed to publish will show up here.',
    },
    query: {
      'sys.status': 'failed',
      order: '-scheduledFor.datetime',
      limit: 40,
    },
  },
} as Record<keyof typeof TabTypes, any>;

export { TabTypes, TabsData };
