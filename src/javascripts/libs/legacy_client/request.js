import _ from 'lodash';

/**
 * Immutable representation of the path, method, payload, and headers
 * of an HTTP request.
 *
 * Use the chainable methods `path`, `payload`, and `headers` to
 * construct a request. These methods return an object with the
 * parameters extends.
 *
 * The `send` method executes the request.
 */
function Request(adapter, params) {
  this.adapter = adapter;
  this._params = params || {};
}

Request.prototype.send = function send(method) {
  if (this._params.error) {
    return Promise.reject(this._params.error);
  }

  const params = _.pick(this._params, ['path', 'headers', 'payload']);

  params.method = method;
  if (method === 'PUT' && this._params.putHeaders) {
    params.headers = _.extend(params.headers || {}, this._params.putHeaders);
  }

  if (_.isEmpty(params.headers)) {
    delete params.headers;
  }

  const responseHandler = this._params.responseHandler || identity;
  return this.adapter.request(params).then(responseHandler);
};

Request.prototype.get = _.partial(Request.prototype.send, 'GET');
Request.prototype.post = _.partial(Request.prototype.send, 'POST');
Request.prototype.put = _.partial(Request.prototype.send, 'PUT');
Request.prototype.delete = _.partial(Request.prototype.send, 'DELETE');

Request.prototype.throw = function (error) {
  return this._clone({ error: error });
};

Request.prototype.rejectEmpty = function () {
  return this._clone({ responseHandler: rejectEmpty });
};

Request.prototype.payload = function (payload) {
  return this._clone({ payload: payload });
};

Request.prototype.headers = function (headers) {
  headers = _.extend({}, this._params.headers, headers);
  return this._clone({ headers: headers });
};

Request.prototype.deleteHeader = function (name) {
  const headers = _.omit(this._params.headers, name);
  const putHeaders = _.omit(this._params.putHeaders, name);
  return this._clone({
    headers: headers,
    putHeaders: putHeaders,
  });
};

Request.prototype.putHeaders = function (headers) {
  headers = _.extend({}, this._params.putHeaders, headers);
  return this._clone({ putHeaders: headers });
};

Request.prototype.path = function (...args) {
  return this.paths(args);
};

Request.prototype.paths = function (add) {
  const components = [this._params.path].concat(_.toArray(add));
  const newPath = joinPath(components);
  return this._clone({ path: newPath });
};

Request.prototype.getPath = function () {
  return this._params.endpoint || '';
};

Request.prototype._clone = function (params) {
  params = _.extend({}, this._params, params);
  return new Request(this.adapter, params);
};

function joinPath(components) {
  const path = '/' + _.filter(components).join('/');
  return path.replace(/\/+/, '/');
}

function rejectEmpty(response) {
  if (response) {
    return response;
  } else {
    return Promise.reject(new Error('Response not available'));
  }
}

function identity(response) {
  return response;
}

export default Request;
