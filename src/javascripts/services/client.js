'use strict';

angular.module('contentful').factory('client', [
  'require',
  require => {
    const _ = require('lodash');
    const $q = require('$q');
    const Config = require('Config.es6');
    const Client = require('legacy-client');
    const auth = require('Authentication.es6');
    const makeRequest = require('data/Request.es6').default;

    const baseRequest = makeRequest(auth);
    const baseUrl = Config.apiUrl().slice(0, -1); // Remove trailing slash
    const defaultHeaders = {
      'X-Contentful-Skip-Transformation': true,
      'Content-Type': 'application/vnd.contentful.management.v1+json'
    };

    return _.extend(new Client({ request: request }), {
      request: request,
      createSpace: createSpace
    });

    function request(req) {
      req = buildRequest(req);
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

    function buildRequest(data) {
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
