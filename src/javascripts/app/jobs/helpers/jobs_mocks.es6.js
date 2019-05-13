import moment from 'moment';

export const scheduledJobsMock = [
  {
    sys: {
      id: 'job-1',
      createdAt: new Date(),
      createdBy: {
        name: 'Johannes Bugiel'
      },
      status: 'pending'
    },
    scheduledAt: new Date(),
    actionType: 'publish',
    actionPayload: {
      entryId: '1',
      name: 'Ipsum Lorem',
      contentTypeName: 'Blog Post'
    }
  },
  {
    sys: {
      id: 'job-2',
      createdAt: new Date(),
      createdBy: {
        name: 'Johannes Bugiel'
      },
      status: 'pending'
    },
    scheduledAt: new Date(),
    actionType: 'publish',
    actionPayload: {
      entryId: '1',
      name: 'The 10 best pizza places in Wattenscheid',
      contentTypeName: 'Blog Post'
    }
  },
  {
    sys: {
      id: 'job-3',
      createdAt: new Date(),
      createdBy: {
        name: 'Johannes Bugiel'
      },
      status: 'pending'
    },
    scheduledAt: new Date(),
    actionType: 'publish',
    actionPayload: {
      entryId: '1',
      name: 'The 10 best pizza places in Wattenscheid',
      contentTypeName: 'Blog Post'
    }
  },
  {
    sys: {
      id: 'job-4',
      createdAt: new Date(),
      createdBy: {
        name: 'Johannes Bugiel'
      },
      status: 'success'
    },
    scheduledAt: moment().subtract(2, 'd'),
    actionType: 'publish',
    actionPayload: {
      entryId: '1',
      name: 'Ipsum Lorem',
      contentTypeName: 'Blog Post'
    }
  },
  {
    sys: {
      id: 'job-5',
      createdAt: new Date(),
      createdBy: {
        name: 'Johannes Bugiel'
      },
      status: 'error'
    },
    scheduledAt: moment().subtract(3, 'd'),
    actionType: 'publish',
    actionPayload: {
      entryId: '1',
      name: 'Ipsum Lorem',
      contentTypeName: 'Blog Post'
    }
  }
];
