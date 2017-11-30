'use strict';

var _ = require('lodash-node/modern');
var RequestQueue = require('./request_queue');

/**
 * An adapter provides the request method to execute HTTP requests and
 * promises the reponse.
 *
 * @param {string} baseUrl  Prepend this to the path of the request.
 * @param {function} performRequest  Runs the actual request and
 * promises the server response. The function accepts an object with
 * the following properties:
 *
 *  - `method`  Uppercase HTTP method
 *  - `url`     Absolute HTTP URL
 *  - `params`  Object to construct the query part of the URL
 *  - `data`    Object to send as data
 *  - `headers` Map of strings specifying the headers
 */
function Adapter (baseUrl, performRequest) {
  if (baseUrl.substr(-1) === '/') { baseUrl = baseUrl.substr(0, baseUrl.length - 1); }

  this._baseUrl = baseUrl;
  this._requestQueue = new RequestQueue();
  this._defaultHeaders = {};
  this._performRequest = performRequest;
}

Adapter.prototype = Object.create(null);


/**
 * Execute the HTTP request.
 *
 * @param {Object} params
 * @param {string} params.method
 * @param {string} params.path
 * @param {Object} params.headers
 * @param {Object} params.payload  The query part for GET requests or
 * the data for POST and PUT requests.
 */
Adapter.prototype.request = function (req) {
  var request = {};
  request.method = req.method;
  request.url = this._baseUrl + req.path;
  request.headers = _.extend({}, this._defaultHeaders, req.headers);

  if (request.method === 'GET') {
    request.params = req.payload;
  } else {
    request.data = req.payload;
  }

  var self = this;
  return this._requestQueue.push(function () {
    return self._performRequest(request);
  });
};


/**
 * Add a header to be send with all requests.
 */
Adapter.prototype.setHeader = function (name, value) {
  this._defaultHeaders[name] = value;
};


module.exports = Adapter;
