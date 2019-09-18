import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import Client from 'legacy-client';

export default function register() {
  registerFactory('client', [
    '$q',
    $q => {
      const defaultHeaders = {
        'X-Contentful-Skip-Transformation': true,
        'Content-Type': 'application/vnd.contentful.management.v1+json'
      };

      return _.extend(new Client({ request: request }), {
        request: request,
        createSpace: createSpace
      });

      async function request(req) {
        req = await buildRequest(req);

        const [auth, { default: makeRequest }] = await Promise.all([
          import('Authentication.es6'),
          import('data/Request.es6')
        ]);
        const baseRequest = makeRequest(auth);

        return baseRequest(req).then(
          res => res.data,
          (
            res // @todo most likely we should reject with an Error instance
          ) =>
            $q.reject({
              // We duplicate this property because `statusCode` is used througout the code base
              statusCode: parseInt(res.status, 10),
              status: res.status,
              body: res.data,
              request: req
            })
        );
      }

      async function buildRequest(data) {
        const Config = await import('Config.es6');
        const baseUrl = Config.apiUrl().slice(0, -1); // Remove trailing slash

        const req = {
          method: data.method,
          url: [baseUrl, data.path.replace(/^\/+/, '')].join('/'),
          headers: _.extend({}, defaultHeaders, data.headers)
        };

        const payloadProperty = data.method === 'GET' ? 'params' : 'data';
        req[payloadProperty] = data.payload;

        return req;
      }

      function createSpace(payload, organizationId) {
        return request({
          method: 'POST',
          path: '/spaces',
          payload: payload,
          headers: { 'X-Contentful-Organization': organizationId }
        });
      }
    }
  ]);
}
