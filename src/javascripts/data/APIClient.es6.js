import _ from 'lodash';

/**
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
 * import APIClient from 'data/APIClient.es6';
 * const client = new APIClient(spaceContext.endpoint);
 * client.getEntries(query).then(handleResponses);
 */

export default function APIClient(spaceEndpoint) {
  this._endpoint = spaceEndpoint;
  this.envId = spaceEndpoint.envId;
  this.spaceId = spaceEndpoint.spaceId;
}

APIClient.prototype._get = function(path, query) {
  return this._request({
    method: 'GET',
    path: path,
    query: query
  });
};

APIClient.prototype._getResources = function(name, query) {
  return this._get([name], query);
};

APIClient.prototype._getResource = function(path, id) {
  return this._get([path, id]);
};

APIClient.prototype.getContentTypes = function(query) {
  return this._getResources('content_types', query);
};

APIClient.prototype.getEntries = function(query) {
  return this._getResources('entries', query);
};

APIClient.prototype.getEntrySnapshots = function(entryId, query) {
  return this._get(['entries', entryId, 'snapshots'], query);
};

APIClient.prototype.getAssets = function(query) {
  return this._getResources('assets', query);
};

/*
 * TODO (mudit): Switch from this deprecated end point
 * once contentful-management.js is updated
 */
APIClient.prototype.getPublishedEntries = function(query) {
  return this._getResources('public/entries', query);
};

APIClient.prototype.getPublishedAssets = function(query) {
  return this._getResources('public/assets', query);
};

APIClient.prototype.getContentType = function(id) {
  return this._getResource('content_types', id);
};

APIClient.prototype.getEntry = function(id) {
  return this._getResource('entries', id);
};

APIClient.prototype.getEntrySnapshot = function(entryId, snapshotId) {
  return this._get(['entries', entryId, 'snapshots', snapshotId]);
};

APIClient.prototype.getAsset = function(id) {
  return this._getResource('assets', id);
};

APIClient.prototype._createResource = function(name, data, headers) {
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

APIClient.prototype.createContentType = function(data) {
  return this._createResource('content_types', data);
};

APIClient.prototype.createEntry = function(contentType, data) {
  return this._createResource('entries', data, { 'X-Contentful-Content-Type': contentType });
};

APIClient.prototype.createAsset = function(data) {
  return this._createResource('assets', data);
};

APIClient.prototype._updateResource = function(path, data) {
  const id = getId(data);
  const version = getVersion(data);
  return this._request({
    method: 'PUT',
    path: [path, id],
    data: data,
    version: version
  });
};

APIClient.prototype.updateContentType = function(data) {
  const self = this;
  return this._updateResource('content_types', data).then(data => self.publishContentType(data));
};

APIClient.prototype.updateEntry = function(data) {
  return this._updateResource('entries', data);
};

APIClient.prototype.updateAsset = function(data) {
  return this._updateResource('assets', data);
};

APIClient.prototype._setResourceFlag = function(name, data, flag, version) {
  const id = getId(data);
  version = version || getVersion(data);
  return this._request({
    method: 'PUT',
    path: [name, id, flag],
    version: version
  });
};

APIClient.prototype._unsetResourceFlag = function(name, data, flag) {
  const id = getId(data);
  return this._request({
    method: 'DELETE',
    path: [name, id, flag]
  });
};

APIClient.prototype.publishEntry = function(data, version) {
  return this._setResourceFlag('entries', data, 'published', version);
};

APIClient.prototype.publishContentType = function(data, version) {
  return this._setResourceFlag('content_types', data, 'published', version);
};

APIClient.prototype.publishAsset = function(data, version) {
  return this._setResourceFlag('assets', data, 'published', version);
};

APIClient.prototype.unpublishEntry = function(data) {
  return this._unsetResourceFlag('entries', data, 'published');
};

APIClient.prototype.unpublishContentType = function(data) {
  return this._unsetResourceFlag('content_types', data, 'published');
};

APIClient.prototype.unpublishAsset = function(data) {
  return this._unsetResourceFlag('content_types', data, 'published');
};

APIClient.prototype.archiveEntry = function(data, version) {
  return this._setResourceFlag('entries', data, 'archived', version);
};

APIClient.prototype.archiveContentType = function(data, version) {
  return this._setResourceFlag('content_types', data, 'archived', version);
};

APIClient.prototype.archiveAsset = function(data, version) {
  return this._setResourceFlag('assets', data, 'archived', version);
};

APIClient.prototype.unarchiveEntry = function(data) {
  return this._unsetResourceFlag('entries', data, 'archived');
};

APIClient.prototype.unarchiveContentType = function(data) {
  return this._unsetResourceFlag('content_types', data, 'archived');
};

APIClient.prototype.unarchiveAsset = function(data) {
  return this._unsetResourceFlag('content_types', data, 'archived');
};

APIClient.prototype._deleteResource = function(name, data) {
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

APIClient.prototype.deleteContentType = function(data) {
  const self = this;
  return this.unpublishContentType(data)
    .catch(() => {})
    .then(() => self._deleteResource('content_types', data));
};

APIClient.prototype.deleteEntry = function(data) {
  return this._deleteResource('entries', data);
};

APIClient.prototype.deleteAsset = function(data) {
  return this._deleteResource('assets', data);
};

APIClient.prototype.processAsset = function(asset, fileId, version) {
  const id = getId(asset);
  version = version || getVersion(asset);
  return this._request({
    method: 'PUT',
    version: version,
    path: ['assets', id, 'files', fileId, 'process']
  });
};

APIClient.prototype.deleteSpace = function() {
  return (
    this._request({ method: 'DELETE' })
      // discard the response data
      .then(_.noop)
  );
};

APIClient.prototype.renameSpace = function(newName, version) {
  return this._request({
    method: 'PUT',
    version: version,
    data: { name: newName }
  });
};

APIClient.prototype.getExtensions = function() {
  return this._getResources('extensions');
};

APIClient.prototype.getExtension = function(id) {
  return this._getResource('extensions', id);
};

APIClient.prototype.createExtension = function(data) {
  return this._createResource('extensions', data);
};

APIClient.prototype.updateExtension = function(data) {
  return this._updateResource('extensions', data);
};

APIClient.prototype.deleteExtension = function(id) {
  return this._deleteResource('extensions', id);
};

APIClient.prototype._request = function(req, headers) {
  return this._endpoint(req, headers);
};

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
