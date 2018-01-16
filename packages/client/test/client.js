const {createRequestStub} = require('./support');

const Client = require('../lib/client');
const describeSpaceInstance = require('./space_instance');

describe('client', function () {
  beforeEach(function () {
    this.request = createRequestStub();
    this.client = new Client({
      request: ({ method, path, headers, payload }) => {
        const payloadKey = method === 'GET' ? 'params' : 'data';
        return this.request.adapterRequest({
          method,
          url: path,
          headers,
          [payloadKey]: payload
        });
      }
    });
  });

  describe('space', function () {
    const serverSpaceData = Object.freeze({
      name: 'myspace',
      sys: {
        id: '42',
        type: 'Space',
        version: 0
      }
    });

    describeSpaceInstance(serverSpaceData);
  });
});
