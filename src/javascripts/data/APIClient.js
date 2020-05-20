import { get } from 'lodash';
import {
  ENTRY_VALIDATION,
  ENTRY_REFERENCES_ENDPOINT,
  IMMEDIATE_RELEASE,
  getAlphaHeader,
} from 'alphaHeaders.js';

const entryValidationAlphaHeader = getAlphaHeader(ENTRY_VALIDATION);

/**
 * @description
 * A basic client for the CMA that manages the Content Types,
 * Editor Interfaces, Entries, Entry Snapshots, Assets, Extensions
 * of a given space.
 *
 * It requires a space endpoint request function as the constructor
 * argument.
 *
 * @usage[js]
 * import APIClient from 'data/APIClient';
 * const client = new APIClient(spaceContext.endpoint);
 * client.getEntries(query).then(handleResponses);
 */

export default function APIClient(spaceEndpoint) {
  this._endpoint = spaceEndpoint;
  this.envId = spaceEndpoint.envId;
  this.spaceId = spaceEndpoint.spaceId;
}

APIClient.prototype._get = function (path, query) {
  return this._request({
    method: 'GET',
    path,
    query,
  });
};

APIClient.prototype._getResources = function (name, query) {
  return this._get([name], query);
};

APIClient.prototype._getResource = function (path, id) {
  return this._get([path, id]);
};

APIClient.prototype.getContentTypes = function (query) {
  return this._getResources('content_types', query);
};

APIClient.prototype.getEditorInterfaces = function () {
  return this._getResources('editor_interfaces');
};

APIClient.prototype.getEntries = function (query) {
  return this._getResources('entries', query);
};

APIClient.prototype.getEntrySnapshots = function (entryId, query) {
  return this._get(['entries', entryId, 'snapshots'], query);
};

APIClient.prototype.getAssets = function (query) {
  return this._getResources('assets', query);
};

APIClient.prototype.getPublishedEntries = function (query) {
  return this._getResources('public/entries', query);
};

APIClient.prototype.getPublishedAssets = function (query) {
  return this._getResources('public/assets', query);
};

APIClient.prototype.getContentType = function (id) {
  return this._getResource('content_types', id);
};

APIClient.prototype.getEditorInterface = async function (contentTypeId) {
  // Return an empty editor interface if no ID is
  // given (for example a content type is new).
  if (!contentTypeId) {
    return { sys: { id: 'default', type: 'EditorInterface' }, controls: [] };
  }

  const path = ['content_types', contentTypeId, 'editor_interface'];

  try {
    return await this._get(path);
  } catch (err) {
    if (!err || err.status !== 404) {
      throw err;
    }
  }

  // It's completely fine to get 404 when fetching
  // an editor interface (for example when a content
  // type is not published); return an empty one but
  // linked to a content type in this case.
  return {
    sys: { id: 'default', type: 'EditorInterface', contentType: { sys: { id: contentTypeId } } },
    controls: [],
  };
};

APIClient.prototype.getEntry = function (id) {
  return this._getResource('entries', id);
};

APIClient.prototype.getEntrySnapshot = function (entryId, snapshotId) {
  return this._get(['entries', entryId, 'snapshots', snapshotId]);
};

APIClient.prototype.getAsset = function (id) {
  return this._getResource('assets', id);
};

APIClient.prototype._createResource = function (name, data, headers) {
  const id = getId(data);
  const method = id ? 'PUT' : 'POST';

  return this._request(
    {
      method,
      path: [name, id],
      data,
    },
    headers
  );
};

APIClient.prototype.createContentType = function (data) {
  return this._createResource('content_types', data);
};

APIClient.prototype.createEntry = function (contentType, data) {
  return this._createResource('entries', data, { 'X-Contentful-Content-Type': contentType });
};

APIClient.prototype.createAsset = function (data) {
  return this._createResource('assets', data);
};

APIClient.prototype._updateResource = function (path, data) {
  return this._request({
    method: 'PUT',
    path: [path, getId(data)],
    data,
    version: getVersion(data),
  });
};

APIClient.prototype.updateContentType = async function (data) {
  const updated = await this._updateResource('content_types', data);

  return this.publishContentType(updated);
};

APIClient.prototype.updateEditorInterface = function (data) {
  const contentTypeId = get(data, ['sys', 'contentType', 'sys', 'id']);

  return this._request({
    method: 'PUT',
    path: ['content_types', contentTypeId, 'editor_interface'],
    data,
    version: getVersion(data),
  });
};

APIClient.prototype.updateEntry = function (data) {
  return this._updateResource('entries', data);
};

APIClient.prototype.updateAsset = function (data) {
  return this._updateResource('assets', data);
};

APIClient.prototype.updateAppInstallation = function (
  appDefinitionId,
  parameters = {},
  isMarketplaceInstallation = false
) {
  return this._request(
    {
      method: 'PUT',
      path: ['app_installations', appDefinitionId],
      data: { parameters },
    },
    isMarketplaceInstallation
      ? {
          'X-Contentful-Marketplace': [
            'i-accept-marketplace-terms-of-service',
            'i-accept-end-user-license-agreement',
            'i-accept-privacy-policy',
          ].join(','),
        }
      : {}
  );
};

APIClient.prototype._setResourceFlag = function (name, data, flag, version) {
  const id = getId(data);
  version = version || getVersion(data);
  return this._request({
    method: 'PUT',
    path: [name, id, flag],
    version,
  });
};

APIClient.prototype._unsetResourceFlag = function (name, data, flag) {
  const id = getId(data);
  return this._request({
    method: 'DELETE',
    path: [name, id, flag],
  });
};

APIClient.prototype.publishEntry = function (data, version) {
  return this._setResourceFlag('entries', data, 'published', version);
};

APIClient.prototype.getEntryReferences = function (id) {
  return this._request(
    {
      method: 'GET',
      path: ['entries', id, 'references'],
    },
    {
      ...getAlphaHeader(ENTRY_REFERENCES_ENDPOINT),
    }
  );
};

APIClient.prototype.validateEntry = function (data, version) {
  const id = getId(data);
  version = version || getVersion(data);
  return this._request(
    {
      method: 'PUT',
      path: ['entries', id, 'published'],
      version,
    },
    {
      'x-contentful-validate-only': 'true',
      'x-contentful-skip-transformation': 'true',
      ...entryValidationAlphaHeader,
    }
  );
};

APIClient.prototype.getReleases = function (query) {
  return this._getResource('releases', query);
};

APIClient.prototype.validateRelease = function (action, entities, type = 'immediate') {
  return this._request(
    {
      method: 'POST',
      path: ['releases', type, 'validations'],
      data: {
        action,
        entities,
      },
    },
    {
      ...getAlphaHeader(IMMEDIATE_RELEASE),
    }
  );
};

APIClient.prototype.executeRelease = function (action, entities, id = 'immediate') {
  return this._request(
    {
      method: 'POST',
      path: ['releases', id, 'execute'],
      data: {
        action,
        entities,
      },
    },
    {
      ...getAlphaHeader(IMMEDIATE_RELEASE),
    }
  );
};

APIClient.prototype.publishContentType = function (data, version) {
  return this._setResourceFlag('content_types', data, 'published', version);
};

APIClient.prototype.publishAsset = function (data, version) {
  return this._setResourceFlag('assets', data, 'published', version);
};

APIClient.prototype.unpublishEntry = function (data) {
  return this._unsetResourceFlag('entries', data, 'published');
};

APIClient.prototype.unpublishContentType = function (data) {
  return this._unsetResourceFlag('content_types', data, 'published');
};

APIClient.prototype.unpublishAsset = function (data) {
  return this._unsetResourceFlag('content_types', data, 'published');
};

APIClient.prototype.archiveEntry = function (data, version) {
  return this._setResourceFlag('entries', data, 'archived', version);
};

APIClient.prototype.archiveContentType = function (data, version) {
  return this._setResourceFlag('content_types', data, 'archived', version);
};

APIClient.prototype.archiveAsset = function (data, version) {
  return this._setResourceFlag('assets', data, 'archived', version);
};

APIClient.prototype.unarchiveEntry = function (data) {
  return this._unsetResourceFlag('entries', data, 'archived');
};

APIClient.prototype.unarchiveContentType = function (data) {
  return this._unsetResourceFlag('content_types', data, 'archived');
};

APIClient.prototype.unarchiveAsset = function (data) {
  return this._unsetResourceFlag('content_types', data, 'archived');
};

APIClient.prototype._deleteResource = async function (name, data) {
  await this._request({
    method: 'DELETE',
    path: [name, getId(data)],
  });
  // Resolve with nothing.
};

APIClient.prototype.deleteContentType = async function (data) {
  try {
    await this.unpublishContentType(data);
  } catch (err) {
    // Failed to unpublish, still try to delete.
  }

  return this._deleteResource('content_types', data);
};

APIClient.prototype.deleteEntry = function (data) {
  return this._deleteResource('entries', data);
};

APIClient.prototype.deleteAsset = function (data) {
  return this._deleteResource('assets', data);
};

APIClient.prototype.processAsset = function (asset, fileId, version) {
  const id = getId(asset);
  version = version || getVersion(asset);
  return this._request({
    method: 'PUT',
    version: version,
    path: ['assets', id, 'files', fileId, 'process'],
  });
};

APIClient.prototype.deleteSpace = async function () {
  await this._request({ method: 'DELETE' });
  // Resolve with nothing.
};

APIClient.prototype.renameSpace = function (newName, version) {
  return this._request({
    method: 'PUT',
    version,
    data: { name: newName },
  });
};

APIClient.prototype.getExtensions = function (query) {
  return this._getResources('extensions', query);
};

// Fetches all Extension entities in an environment to be
// used for listing purposes.
//
// Note they don't include srcdoc property so they cannot
// be used for rendering and (for the same reason) cannot
// be cached.
APIClient.prototype.getExtensionsForListing = function () {
  return this.getExtensions({
    stripSrcdoc: 'true', // Yes, this needs to be a string (it's a value in QS).
    limit: 1000, // No srcdoc due to `stripSrcdoc`. We can safely fetch 1000.
  });
};

APIClient.prototype.getAppInstallations = function () {
  return this._getResource('app_installations');
};

APIClient.prototype.getExtension = async function (id) {
  return this._getResource('extensions', id);
};

APIClient.prototype.getAppInstallation = function (appDefinitionId) {
  return this._getResource('app_installations', appDefinitionId);
};

APIClient.prototype.createExtension = function (data) {
  return this._createResource('extensions', data);
};

APIClient.prototype.updateExtension = function (data) {
  return this._updateResource('extensions', data);
};

APIClient.prototype.deleteExtension = function (id) {
  return this._deleteResource('extensions', id);
};

APIClient.prototype.deleteAppInstallation = function (appDefinitionId) {
  return this._deleteResource('app_installations', appDefinitionId);
};

APIClient.prototype._request = function (req, headers) {
  return this._endpoint(req, headers);
};

function getId(identifiable) {
  if (typeof identifiable === 'string') {
    return identifiable;
  } else {
    return get(identifiable, ['sys', 'id']);
  }
}

function getVersion(resource) {
  return get(resource, ['sys', 'version']);
}
