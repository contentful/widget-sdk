'use strict';

angular.module('cf.data')

/**
 * @ngdoc type
 * @name Data.APIClient
 * @module cf.data
 * @description
 * A basic client for the CMA that manages the Content Types, Entries,
 * and Assets of a given space.
 *
 * It has almost the same interface as the [Javascript CMA
 * library][cma-js].
 *
 * [cma-js]: https://github.com/contentful/contentful-management.js
 *
 * @usage[js]
 * var APIClient = $injector.get('data/APIClient')
 * var client = new APIClient(spaceID, accessToken)
 * client.getEntries(query).then(handleResponses)
 */
.factory('data/ApiClient', ['$injector', function ($injector) {
  var $q = $injector.get('$q');
  var $http = $injector.get('$http');
  var env = $injector.get('environment');

  function Client (spaceId, token) {
    this._token = token;
    this._spaceId = spaceId;
    this._baseURL = '//' + env.settings.api_host + '/spaces/' + spaceId;
  }

  Client.prototype._getResource = function (path, id) {
    return this._request({
      method: 'GET',
      path: [path, id]
    });
  };

  Client.prototype.getContentTypes = function (query) {
    return this._getResources('content_types', query);
  };

  Client.prototype.getEntries = function (query) {
    return this._getResources('entries', query);
  };

  Client.prototype.getAssets = function (query) {
    return this._getResources('assets', query);
  };


  Client.prototype._getResources = function (name, query) {
    return this._request({
      method: 'GET',
      path: [name],
      params: query
    });
  };

  Client.prototype.getContentType = function (id) {
    return this._getResource('content_types', id);
  };

  Client.prototype.getEntry = function (id) {
    return this._getResource('entries', id);
  };

  Client.prototype.getAsset = function (id) {
    return this._getResource('assets', id);
  };

  Client.prototype._createResource = function (name, data, headers) {
    var id = getId(data);
    var method = id ? 'PUT' : 'POST';
    return this._request({
      method: method,
      path: [name, id],
      data: data
    }, headers);
  };

  Client.prototype.createContentType = function (data) {
    return this._createResource('content_types', data);
  };

  Client.prototype.createEntry = function (contentType, data) {
    return this._createResource('entries', data, { 'X-Contentful-Content-Type': contentType });
  };

  Client.prototype.createAsset = function (data) {
    return this._createResource('assets', data);
  };


  Client.prototype._updateResource = function (path, data) {
    var id = getId(data);
    var version = getVersion(data);
    return this._request({
      method: 'PUT',
      path: [path, id],
      data: data,
      version: version
    });
  };

  Client.prototype.updateContentType = function (data) {
    var self = this;
    return this._updateResource('content_types', data)
    .then(function (data) {
      return self.publishContentType(data);
    });
  };

  Client.prototype.updateEntry = function (data) {
    return this._updateResource('entries', data);
  };

  Client.prototype.updateAsset = function (data) {
    return this._updateResource('assets', data);
  };


  Client.prototype._setResourceFlag = function (name, data, flag, version) {
    var id = getId(data);
    version = version || getVersion(data);
    return this._request({
      method: 'PUT',
      path: [name, id, flag],
      version: version
    });
  };

  Client.prototype._unsetResourceFlag = function (name, data, flag) {
    var id = getId(data);
    return this._request({
      method: 'DELETE',
      path: [name, id, flag]
    });
  };

  Client.prototype.publishEntry = function (data, version) {
    return this._setResourceFlag('entries', data, 'published', version);
  };

  Client.prototype.publishContentType = function (data, version) {
    return this._setResourceFlag('content_types', data, 'published', version);
  };

  Client.prototype.publishAsset = function (data, version) {
    return this._setResourceFlag('assets', data, 'published', version);
  };

  Client.prototype.unpublishEntry = function (data) {
    return this._unsetResourceFlag('entries', data, 'published');
  };

  Client.prototype.unpublishContentType = function (data) {
    return this._unsetResourceFlag('content_types', data, 'published');
  };

  Client.prototype.unpublishAsset = function (data) {
    return this._unsetResourceFlag('content_types', data, 'published');
  };

  Client.prototype.archiveEntry = function (data, version) {
    return this._setResourceFlag('entries', data, 'archived', version);
  };

  Client.prototype.archiveContentType = function (data, version) {
    return this._setResourceFlag('content_types', data, 'archived', version);
  };

  Client.prototype.archiveAsset = function (data, version) {
    return this._setResourceFlag('assets', data, 'archived', version);
  };

  Client.prototype.unarchiveEntry = function (data) {
    return this._unsetResourceFlag('entries', data, 'archived');
  };

  Client.prototype.unarchiveContentType = function (data) {
    return this._unsetResourceFlag('content_types', data, 'archived');
  };

  Client.prototype.unarchiveAsset = function (data) {
    return this._unsetResourceFlag('content_types', data, 'archived');
  };


  Client.prototype._deleteResource = function (name, data) {
    var id = getId(data);
    return this._request({
      method: 'DELETE',
      path: [name, id]
    })
    // do not return anything
    .then(function () {});
  };

  Client.prototype.deleteContentType = function (data) {
    var self = this;
    return this.unpublishContentType(data)
    .catch(function () {})
    .then(function () {
      return self._deleteResource('content_types', data);
    });
  };

  Client.prototype.deleteEntry = function (data) {
    return this._deleteResource('entries', data);
  };

  Client.prototype.deleteAsset = function (data) {
    return this._deleteResource('assets', data);
  };


  Client.prototype.processAssetFile = function (asset, fileId, version) {
    var id = getId(asset);
    version = version || getVersion(asset);
    return this._request({
      method: 'PUT',
      version: version,
      path: ['assets', id, 'files', fileId, 'process']
    });
  };


  Client.prototype._request = function (req, headers) {
    var httpReq = _.pick(req, ['method', 'params', 'data']);

    var url = [this._baseURL].concat(req.path).join('/');
    httpReq.url = url;

    httpReq.headers = _.extend(headers || {}, {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'Authorization': 'Bearer ' + this._token
    });

    if (req.version) {
      httpReq.headers['X-Contentful-Version'] = req.version;
    }

    return $http(httpReq)
    .then(function (res) {
      return res.data;
    }, function (res) {
      return $q.reject({
        statusCode: res.status,
        code: dotty.get(res, ['data', 'sys', 'id'], res.status),
        body: res.data
      });
    });
  };

  return Client;

  function getId (identifiable) {
    if (_.isString(identifiable)) {
      return identifiable;
    } else {
      return dotty.get(identifiable, ['sys', 'id']);
    }
  }

  function getVersion (resource) {
    return dotty.get(resource, ['sys', 'version']);
  }
}]);
