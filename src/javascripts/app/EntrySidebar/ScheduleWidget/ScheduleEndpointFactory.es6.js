import * as EndpointFactory from 'data/EndpointFactory.es6';

const createMockCollectionResponse = items => {
  return {
    items,
    limit: 1000,
    skip: 0,
    sys: { type: 'Array' },
    total: items.length
  };
};

const mockSchedules = [];

function createMockEndpoint() {
  return params => {
    if (params.method === 'GET') {
      return new Promise(res => {
        setTimeout(() => {
          res(createMockCollectionResponse(mockSchedules));
        }, 1000);
      });
    } else if (params.method === 'POST') {
      return new Promise(res => {
        setTimeout(() => {
          const newSchedule = params.data;
          mockSchedules.push(newSchedule);
          res(newSchedule);
        }, 300);
      });
    }
  };
}

/**
 * Module created to provide mock implementation of the schedule endpoints
 * to allow development of the widget w/o existing endpoint in the api.
 */
export function createSpaceEndpoint(spaceId, envId) {
  const useMockEndpoint = true;

  if (useMockEndpoint) {
    return createMockEndpoint();
  } else {
    return EndpointFactory.createSpaceEndpoint(spaceId, envId);
  }
}
