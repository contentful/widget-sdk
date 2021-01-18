import Client from 'libs/legacy_client/client';
import describeSpaceInstance from './__mocks__/space_instance';
import _ from 'lodash';

describe('legacyClient', function () {
  const context = {};
  beforeEach(function () {
    context.request = createRequestStub();
    context.client = new Client({
      request: ({ method, path, headers, payload }) => {
        const payloadKey = method === 'GET' ? 'params' : 'data';
        return context.request.adapterRequest({
          method,
          url: path,
          headers,
          [payloadKey]: payload,
        });
      },
    });
  });

  describe('space', function () {
    const serverSpaceData = Object.freeze({
      name: 'myspace',
      sys: {
        id: '42',
        type: 'Space',
        version: 0,
      },
    });

    describeSpaceInstance(serverSpaceData, context);
  });
});

function createRequestStub() {
  const request = jest.fn(function ({ payload }) {
    if (!request.responses.length) {
      throw new Error('No server responses provided');
    }
    const { data, error, mirror } = request.responses.shift();
    if (error) {
      return Promise.reject(error);
    } else if (mirror) {
      return Promise.resolve(_.cloneDeep(payload));
    } else {
      return Promise.resolve(_.cloneDeep(data));
    }
  });

  request.respond = function (response) {
    if (typeof response === 'undefined') {
      this.responses.push({ mirror: true });
    } else {
      this.responses.push({ data: _.cloneDeep(response) });
    }
  };

  request.throw = function (error) {
    this.responses.push({ error: error });
  };

  request.reset = function () {
    this.responses = [];
    request.mockClear();
  };

  /**
   * Simplifies request parameters to facilitate asserting call
   * arguments.
   */
  request.adapterRequest = function (r) {
    if (_.isEmpty(r.headers)) {
      delete r.headers;
    }
    if (!r.params) {
      delete r.params;
    }
    if (!r.data) {
      delete r.data;
    }
    return request(r);
  };

  request.reset();
  return request;
}
