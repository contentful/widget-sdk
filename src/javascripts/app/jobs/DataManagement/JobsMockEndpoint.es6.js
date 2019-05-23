import _ from 'lodash';

const createMockCollectionResponse = items => {
  return {
    items,
    limit: 1000,
    skip: 0,
    sys: { type: 'Array' },
    total: items.length
  };
};

const mockSchedules = [
  {
    sys: {
      id: '4VRHYuaEZWusk6kgqqSeoG',
      scheduledBy: {
        sys: {
          type: 'Link',
          id: '4A3fIQBI2IaKZamCHiOJac'
        }
      },
      entity: {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: '20zKlMRvQQ0UQccawgA2iI'
        }
      },
      status: 'pending'
    },
    scheduledAt: '2019-05-24T14:00:35Z',
    action: 'publish'
  }
];

const mocks = [
  {
    method: 'GET',
    path: ['jobs'],
    implementation: _params => {
      return new Promise(res => {
        setTimeout(() => {
          res(createMockCollectionResponse(mockSchedules));
        }, 1000);
      });
    }
  },
  {
    method: 'POST',
    path: ['jobs'],
    implementation: params => {
      return new Promise(res => {
        setTimeout(() => {
          const newSchedule = params.data;
          mockSchedules.push(newSchedule);
          res(newSchedule);
        }, 300);
      });
    }
  }
];

export function createMockEndpoint(endpoint) {
  const useMockEndpoint = false;
  return (params, ...args) => {
    const mock = mocks.find(m => m.method === params.method && _.isEqual(m.path, params.path));

    if (useMockEndpoint && mock) {
      return mock.implementation(params, ...args);
    }
    return endpoint(params, ...args);
  };
}
