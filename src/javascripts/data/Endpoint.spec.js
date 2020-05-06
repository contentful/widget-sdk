import * as Endpoint from './Endpoint';

const mockRequest = jest.fn();
jest.mock('data/Request', () => jest.fn(() => mockRequest));

const auth = jest.fn();
const baseUrl = '//test.io';

const doRequest = function (...args) {
  const request = Endpoint.create(baseUrl, auth);
  const response = request(...args);
  return response;
};

describe('Endpoint', () => {
  it('sends GET request relative to resource', function () {
    const url = `${baseUrl}/foo/bar`;

    doRequest({
      method: 'GET',
      path: ['foo', 'bar'],
    });

    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET', url }));
  });

  it('ignores empty path values', function () {
    doRequest({
      method: 'GET',
      path: [null, 'fuzz', undefined, 'buzz'],
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: `${baseUrl}/fuzz/buzz` })
    );
  });

  it('resolves the promise with response data', async () => {
    mockRequest.mockResolvedValueOnce('DATA');

    const response = await doRequest({
      method: 'GET',
      path: ['foo', 'bar'],
    });

    expect(response).toEqual('DATA');
  });

  it('allows extra headers', function () {
    doRequest(
      {
        method: 'POST',
        path: ['foo', 'bar'],
      },
      { 'X-Contentful-Foo': 'Bar' }
    );

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { 'X-Contentful-Foo': 'Bar' } })
    );
  });

  it('sends POST request without version header', function () {
    doRequest({
      method: 'POST',
      path: ['foo', 'bar'],
    });
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ headers: {} }));
  });

  it('sends POST request with version header', function () {
    doRequest({
      method: 'POST',
      path: ['foo', 'bar'],
      version: 3,
    });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { 'X-Contentful-Version': 3 } })
    );
  });

  describe('error response', () => {
    beforeEach(() => {
      // jest doesn't support the Response() constructor
      const response = { json: jest.fn() };
      mockRequest.mockRejectedValueOnce(response);
    });

    it('is an error object', async function () {
      const req = doRequest({
        method: 'GET',
        path: ['foo'],
      });

      let error;

      try {
        await req;
      } catch (e) {
        error = e;
      }

      expect(error instanceof Error).toBe(true);
      expect(error.message).toEqual('API request failed');
    });

    it('has "request" object', async function () {
      const req = doRequest({
        method: 'GET',
        path: ['foo'],
      });

      let error;

      try {
        await req;
      } catch (e) {
        error = e;
      }

      expect(error.request.method).toBe('GET');
      expect(error.request.url).toBe(`${baseUrl}/foo`);
    });
  });

  describeCreateEndpoint('createSpaceEndpoint', 'spaces');
  describeCreateEndpoint('createOrganizationEndpoint', 'organizations');

  function describeCreateEndpoint(methodName, endpointUrl) {
    describe(`.${methodName}()`, () => {
      it(`sends request relative to ${endpointUrl} resource`, async () => {
        const endpoint = Endpoint[methodName](baseUrl, 'ID', auth);
        await endpoint({
          method: 'GET',
          path: ['foo', 'bar'],
        });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({ url: `//test.io/${endpointUrl}/ID/foo/bar` })
        );
      });

      it("doesn't add extra slashes to url", async () => {
        const endpoint = Endpoint[methodName](baseUrl, 'ID', auth);
        await endpoint({
          method: 'GET',
          path: ['/foo/', '/bar/'],
        });
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({ url: `//test.io/${endpointUrl}/ID/foo/bar/` })
        );
      });
    });
  }
});
