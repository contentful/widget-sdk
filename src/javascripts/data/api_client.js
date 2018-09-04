'use strict';

angular
  .module('cf.data')

  /**
   * @ngdoc type
   * @name Data.APIClient
   * @module cf.data
   * @description
   * A basic client for the CMA that manages the Content Types, Entries,
   * Entry Snapshots and Assets of a given space.
   *
   * It has almost the same interface as the [Javascript CMA
   * library][cma-js].
   *
   * It requires a space endpoint request function as the constructor
   * argument.
   *
   * [cma-js]: https://github.com/contentful/contentful-management.js
   *
   * @usage[js]
   * var APIClient = require('data/APIClient');
   * var createSpaceEndpoint = require('data/Endpoint.es6').createSpaceEndpoint;
   * var client = new APIClient(createSpaceEndpoint(...));
   * client.getEntries(query).then(handleResponses);
   */
  .factory('data/ApiClient', [
    () => {
      function Client(spaceEndpoint) {
        this._endpoint = spaceEndpoint;
      }

      Client.prototype._get = function(path, query) {
        return this._request({
          method: 'GET',
          path: path,
          query: query
        });
      };

      Client.prototype._getResources = function(name, query) {
        return this._get([name], query);
      };

      Client.prototype._getResource = function(path, id) {
        return this._get([path, id]);
      };

      Client.prototype.getContentTypes = function(query) {
        return this._getResources('content_types', query);
      };

      Client.prototype.getEntries = function(query) {
        return this._getResources('entries', query);
      };

      Client.prototype.getEntrySnapshots = function(entryId, query) {
        return this._get(['entries', entryId, 'snapshots'], query);
      };

      Client.prototype.getAssets = function(query) {
        return this._getResources('assets', query);
      };

      /*
   * TODO (mudit): Switch from this deprecated end point
   * once contentful-management.js is updated
   */
      Client.prototype.getPublishedEntries = function(query) {
        return this._getResources('public/entries', query);
      };

      Client.prototype.getPublishedAssets = function(query) {
        return this._getResources('public/assets', query);
      };

      Client.prototype.getContentType = function(id) {
        return this._getResource('content_types', id);
      };

      Client.prototype.getEntry = function(id) {
        return this._getResource('entries', id);
      };

      Client.prototype.getEntrySnapshot = function(entryId, snapshotId) {
        return this._get(['entries', entryId, 'snapshots', snapshotId]);
      };

      Client.prototype.getAsset = function(id) {
        return this._getResource('assets', id);
      };

      Client.prototype._createResource = function(name, data, headers) {
        const id = getId(data);
        const method = id ? 'PUT' : 'POST';
        return this._request(
          {
            method: method,
            path: [name, id],
            data: data
          },
          headers
        );
      };

      Client.prototype.createContentType = function(data) {
        return this._createResource('content_types', data);
      };

      Client.prototype.createEntry = function(contentType, data) {
        return this._createResource('entries', data, { 'X-Contentful-Content-Type': contentType });
      };

      Client.prototype.createAsset = function(data) {
        return this._createResource('assets', data);
      };

      Client.prototype._updateResource = function(path, data) {
        const id = getId(data);
        const version = getVersion(data);
        return this._request({
          method: 'PUT',
          path: [path, id],
          data: data,
          version: version
        });
      };

      Client.prototype.updateContentType = function(data) {
        const self = this;
        return this._updateResource('content_types', data).then(data =>
          self.publishContentType(data)
        );
      };

      Client.prototype.updateEntry = function(data) {
        return this._updateResource('entries', data);
      };

      Client.prototype.updateAsset = function(data) {
        return this._updateResource('assets', data);
      };

      Client.prototype._setResourceFlag = function(name, data, flag, version) {
        const id = getId(data);
        version = version || getVersion(data);
        return this._request({
          method: 'PUT',
          path: [name, id, flag],
          version: version
        });
      };

      Client.prototype._unsetResourceFlag = function(name, data, flag) {
        const id = getId(data);
        return this._request({
          method: 'DELETE',
          path: [name, id, flag]
        });
      };

      Client.prototype.publishEntry = function(data, version) {
        return this._setResourceFlag('entries', data, 'published', version);
      };

      Client.prototype.publishContentType = function(data, version) {
        return this._setResourceFlag('content_types', data, 'published', version);
      };

      Client.prototype.publishAsset = function(data, version) {
        return this._setResourceFlag('assets', data, 'published', version);
      };

      Client.prototype.unpublishEntry = function(data) {
        return this._unsetResourceFlag('entries', data, 'published');
      };

      Client.prototype.unpublishContentType = function(data) {
        return this._unsetResourceFlag('content_types', data, 'published');
      };

      Client.prototype.unpublishAsset = function(data) {
        return this._unsetResourceFlag('content_types', data, 'published');
      };

      Client.prototype.archiveEntry = function(data, version) {
        return this._setResourceFlag('entries', data, 'archived', version);
      };

      Client.prototype.archiveContentType = function(data, version) {
        return this._setResourceFlag('content_types', data, 'archived', version);
      };

      Client.prototype.archiveAsset = function(data, version) {
        return this._setResourceFlag('assets', data, 'archived', version);
      };

      Client.prototype.unarchiveEntry = function(data) {
        return this._unsetResourceFlag('entries', data, 'archived');
      };

      Client.prototype.unarchiveContentType = function(data) {
        return this._unsetResourceFlag('content_types', data, 'archived');
      };

      Client.prototype.unarchiveAsset = function(data) {
        return this._unsetResourceFlag('content_types', data, 'archived');
      };

      Client.prototype._deleteResource = function(name, data) {
        const id = getId(data);
        return (
          this._request({
            method: 'DELETE',
            path: [name, id]
          })
            // do not return anything
            .then(() => {})
        );
      };

      Client.prototype.deleteContentType = function(data) {
        const self = this;
        return this.unpublishContentType(data)
          .catch(() => {})
          .then(() => self._deleteResource('content_types', data));
      };

      Client.prototype.deleteEntry = function(data) {
        return this._deleteResource('entries', data);
      };

      Client.prototype.deleteAsset = function(data) {
        return this._deleteResource('assets', data);
      };

      Client.prototype.processAsset = function(asset, fileId, version) {
        const id = getId(asset);
        version = version || getVersion(asset);
        return this._request({
          method: 'PUT',
          version: version,
          path: ['assets', id, 'files', fileId, 'process']
        });
      };

      Client.prototype.deleteSpace = function() {
        return (
          this._request({ method: 'DELETE' })
            // discard the response data
            .then(_.noop)
        );
      };

      Client.prototype.renameSpace = function(newName, version) {
        return this._request({
          method: 'PUT',
          version: version,
          data: { name: newName }
        });
      };

      Client.prototype.getExtensions = function() {
        return this._getResources('extensions');
      };

      Client.prototype.getExtension = function(id) {
        return this._getResource('extensions', id);
      };

      Client.prototype.createExtension = function(data) {
        return this._createResource('extensions', data);
      };

      Client.prototype.updateExtension = function(data) {
        return this._updateResource('extensions', data);
      };

      Client.prototype.deleteExtension = function(id) {
        return this._deleteResource('extensions', id);
      };

      Client.prototype._request = function(req, headers) {
        return this._endpoint(req, headers);
      };

      return Client;

      function getId(identifiable) {
        if (_.isString(identifiable)) {
          return identifiable;
        } else {
          return _.get(identifiable, ['sys', 'id']);
        }
      }

      function getVersion(resource) {
        return _.get(resource, ['sys', 'version']);
      }
    }
  ]);
