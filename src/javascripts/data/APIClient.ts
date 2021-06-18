import { get } from 'lodash';
import { ENTRY_VALIDATION, getAlphaHeader } from 'alphaHeaders.js';
import { SpaceEndpoint } from './CMA/types';
import {
  Asset,
  BulkAction,
  Entity,
  Entry,
  Link,
  PublishBulkActionPayload,
  Release,
  ReleaseAction,
  ValidateBulkActionPayload,
} from '@contentful/types';
import { AppInstallationProps, EditorInterfaceProps } from 'contentful-management/types';
import type { EmbargoedAssetApi } from 'features/embargoed-assets';
import { CollectionResponse, Team } from '@contentful/app-sdk';

const entryValidationAlphaHeader = getAlphaHeader(ENTRY_VALIDATION);

export interface APIClientError<T = any> {
  statusCode: number;
  data: { details: T };
}

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

export default class APIClient {
  private readonly endpoint: SpaceEndpoint;
  public envId: SpaceEndpoint['envId'];
  public spaceId: SpaceEndpoint['spaceId'];

  constructor(spaceEndpoint: SpaceEndpoint) {
    this.endpoint = spaceEndpoint;
    this.envId = spaceEndpoint.envId;
    this.spaceId = spaceEndpoint.spaceId;
  }

  getContentTypes = (query) => {
    return this.getResources('content_types', query);
  };

  getEditorInterfaces = (): Promise<CollectionResponse<EditorInterfaceProps>> => {
    return this.getResources<EditorInterfaceProps>('editor_interfaces');
  };

  getEntries = (query) => {
    return this.getResources('entries', query);
  };

  getEntrySnapshots = (entryId, query) => {
    return this.get(['entries', entryId, 'snapshots'], query);
  };

  getTasks = (entryId) => {
    return this.get(['entries', entryId, 'tasks']);
  };

  getAssets = (query) => {
    return this.getResources('assets', query);
  };

  getPublishedEntries = (query) => {
    return this.getResources('public/entries', query);
  };

  getPublishedAssets = (query) => {
    return this.getResources('public/assets', query);
  };

  getContentType = (id) => {
    return this.getResource('content_types', id);
  };

  getEditorInterface = async (contentTypeId): Promise<EditorInterfaceProps> => {
    // Return an empty editor interface if no ID is
    // given (for example a content type is new).
    if (!contentTypeId) {
      return {
        sys: { id: 'default', type: 'EditorInterface' } as EditorInterfaceProps['sys'],
        controls: [],
      };
    }

    const path = ['content_types', contentTypeId, 'editor_interface'];

    try {
      return await this.get(path);
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
      sys: {
        id: 'default',
        type: 'EditorInterface',
        contentType: { sys: { id: contentTypeId, linkType: 'ContentType', type: 'Link' } },
      } as EditorInterfaceProps['sys'],
      controls: [],
    };
  };

  getEntry = (id: string): Promise<Entry> => {
    return this.getResource('entries', id);
  };

  getEntrySnapshot = (entryId, snapshotId) => {
    return this.get(['entries', entryId, 'snapshots', snapshotId]);
  };

  getTask = (entryId, taskId) => {
    return this.get(['entries', entryId, 'tasks', taskId]);
  };

  getAsset = (id: string): Promise<Asset> => {
    return this.getResource('assets', id);
  };

  createContentType = (data) => {
    return this.createResource('content_types', data);
  };

  createEntry = (contentType, data) => {
    return this.createResource('entries', data, {
      'X-Contentful-Content-Type': contentType,
    });
  };

  createAsset = (data) => {
    return this.createResource('assets', data);
  };

  createTask = (entryId, data) => {
    return this.createResource(`entries/${entryId}/tasks`, data);
  };

  updateContentType = async (data) => {
    const updated = await this.updateResource('content_types', data);

    return this.publishContentType(updated);
  };

  updateEditorInterface = (data) => {
    const contentTypeId = get(data, ['sys', 'contentType', 'sys', 'id']);

    return this.request({
      method: 'PUT',
      path: ['content_types', contentTypeId, 'editor_interface'],
      data,
      version: getVersion(data),
    });
  };

  updateEntry = (data) => {
    return this.updateResource('entries', data);
  };

  updateTask = (entryId, data) => {
    return this.updateResource(`entries/${entryId}/tasks`, data);
  };

  updateAsset = (data) => {
    return this.updateResource('assets', data);
  };

  createAssetKey = (data) => {
    return this.createResource('asset_keys', data);
  };

  updateAppInstallation = (
    appDefinitionId,
    parameters = {},
    isMarketplaceInstallation = false
  ): Promise<AppInstallationProps> => {
    return this.request(
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

  publishEntry = (data, version) => {
    return this.setResourceFlag('entries', data, 'published', version);
  };

  getEntryReferences = (id, maxDepth = 10) => {
    return this.request({
      method: 'GET',
      path: ['entries', id, 'references'],
      query: {
        include: maxDepth,
      },
    });
  };

  validateEntry = (data, version) => {
    const id = getId(data);
    version = version || getVersion(data);
    return this.request(
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

  getReleases = (query): Promise<Release[]> => {
    return this.request({
      method: 'GET',
      path: ['releases'],
      query,
    });
  };

  createRelease = (title, items: { sys: Link['sys'] }[]): Promise<Release> => {
    return this.request({
      method: 'POST',
      path: ['releases'],
      data: {
        title,
        entities: {
          sys: { type: 'Array' },
          items,
        },
      },
    });
  };

  deleteRelease = (id) => {
    return this.request({
      method: 'DELETE',
      path: ['releases', id],
    });
  };

  getReleaseById = (id) => {
    return this.request({
      method: 'GET',
      path: ['releases', id],
    });
  };

  updateRelease = (release: Release) => {
    // FIXIT API rejects if we send a sys, instead should be allowed but ignored
    const { sys: _sys, ...data } = release;

    return this.request({
      method: 'PUT',
      path: ['releases', getId(release)],
      data,
      version: getVersion(release),
    });
  };

  publishRelease = (id, version) => {
    return this.request(
      {
        method: 'PUT',
        path: ['releases', id, 'published'],
      },
      {
        'X-Contentful-Version': version,
      }
    );
  };

  getReleaseAction = (releaseId, actionId): Promise<ReleaseAction> => {
    return this.request({
      method: 'GET',
      path: ['releases', releaseId, 'actions', actionId],
    });
  };

  validateReleaseAction = (releaseId, action) => {
    return this.request({
      method: 'PUT',
      path: ['releases', releaseId, 'validated'],
      action,
    });
  };

  validateRelease = (action, entities, type = 'immediate') => {
    return this.request({
      method: 'POST',
      path: ['releases', type, 'validations'],
      data: {
        action,
        entities,
      },
    });
  };

  executeRelease = (action, entities, id = 'immediate') => {
    return this.request({
      method: 'POST',
      path: ['releases', id, 'execute'],
      data: {
        action,
        entities,
      },
    });
  };

  createPublishBulkAction = (payload: PublishBulkActionPayload): Promise<BulkAction> => {
    return this.request({
      method: 'POST',
      path: ['bulk_actions', 'publish'],
      data: payload,
    });
  };

  createValidationBulkAction = (payload: ValidateBulkActionPayload): Promise<BulkAction> => {
    return this.request({
      method: 'POST',
      path: ['bulk_actions', 'validate'],
      data: payload,
    });
  };

  getBulkAction = (id: string): Promise<BulkAction> => {
    return this.request({
      method: 'GET',
      path: ['bulk_actions', 'actions', id],
    });
  };

  publishContentType = (data, version?) => {
    return this.setResourceFlag('content_types', data, 'published', version);
  };

  publishAsset = (data, version) => {
    return this.setResourceFlag('assets', data, 'published', version);
  };

  unpublishEntry = (data) => {
    return this.unsetResourceFlag('entries', data, 'published');
  };

  unpublishContentType = (data) => {
    return this.unsetResourceFlag('content_types', data, 'published');
  };

  unpublishAsset = (data) => {
    return this.unsetResourceFlag('assets', data, 'published');
  };

  archiveEntry = (data, version) => {
    return this.setResourceFlag('entries', data, 'archived', version);
  };

  archiveContentType = (data, version) => {
    return this.setResourceFlag('content_types', data, 'archived', version);
  };

  archiveAsset = (data, version) => {
    return this.setResourceFlag('assets', data, 'archived', version);
  };

  unarchiveEntry = (data) => {
    return this.unsetResourceFlag('entries', data, 'archived');
  };

  unarchiveContentType = (data) => {
    return this.unsetResourceFlag('content_types', data, 'archived');
  };

  unarchiveAsset = (data) => {
    return this.unsetResourceFlag('assets', data, 'archived');
  };

  deleteContentType = async (data) => {
    try {
      await this.unpublishContentType(data);
    } catch (err) {
      // Failed to unpublish, still try to delete.
    }

    return this.deleteResource('content_types', data);
  };

  deleteEntry = (data) => {
    return this.deleteResource('entries', data);
  };

  deleteTask = (entryId, data) => {
    return this.request({
      method: 'DELETE',
      path: ['entries', entryId, 'tasks', getId(data)],
      version: getVersion(data),
    });
  };

  deleteAsset = (data) => {
    return this.deleteResource('assets', data);
  };

  processAsset = (asset, fileId, version) => {
    const id = getId(asset);
    version = version || getVersion(asset);
    return this.request({
      method: 'PUT',
      version: version,
      path: ['assets', id, 'files', fileId, 'process'],
    });
  };

  deleteSpace = async () => {
    await this.request({ method: 'DELETE' });
    // Resolve with nothing.
  };

  renameSpace = (newName, version) => {
    return this.request({
      method: 'PUT',
      version,
      data: { name: newName },
      path: [],
    });
  };

  getSpaceTeams = () => {
    return this.get<CollectionResponse<Team>>(['spaces', this.spaceId, 'teams'], {
      // The largest organization includes 29 teams, so the limit is sufficient and no pagination is required
      limit: 100,
    });
  };

  getExtensions = (query) => {
    return this.getResources('extensions', query);
  };

  // Fetches all Extension entities in an environment to be
  // used for listing purposes.
  //
  // Note they don't include srcdoc property so they cannot
  // be used for rendering and (for the same reason) cannot
  // be cached.
  getExtensionsForListing = () => {
    return this.getExtensions({
      stripSrcdoc: 'true', // Yes, this needs to be a string (it's a value in QS).
      limit: 1000, // No srcdoc due to `stripSrcdoc`. We can safely fetch 1000.
    });
  };

  getAppInstallations = () => {
    return this.getResource('app_installations');
  };

  getExtension = async (id) => {
    return this.getResource('extensions', id);
  };

  getAppInstallation = (appDefinitionId) => {
    return this.getResource('app_installations', appDefinitionId);
  };

  createExtension = (data) => {
    return this.createResource('extensions', data);
  };

  updateExtension = (data) => {
    return this.updateResource('extensions', data);
  };

  deleteExtension = (id) => {
    return this.deleteResource('extensions', id);
  };

  deleteAppInstallation = (appDefinitionId) => {
    return this.deleteResource('app_installations', appDefinitionId);
  };

  signRequest = (appDefinitionId, data) => {
    return this.createResource(`app_installations/${appDefinitionId}/signed_requests`, data);
  };

  getEmbargoedAssetsSettingLevel = (): Promise<EmbargoedAssetApi> => {
    return this.request({
      method: 'GET',
      path: ['embargoed_assets'],
    });
  };

  setEmbargoedAssetsSettingLevel = (level): Promise<EmbargoedAssetApi> => {
    return this.request({
      method: 'PUT',
      path: ['embargoed_assets'],
      data: {
        protectionMode: level,
      },
    });
  };

  private request = <T>(req, headers?) => {
    return this.endpoint<T>(req, headers);
  };

  private setResourceFlag = (name, data, flag, version) => {
    const id = getId(data);
    version = version || getVersion(data);
    return this.request({
      method: 'PUT',
      path: [name, id, flag],
      version,
    });
  };

  private unsetResourceFlag = (name, data, flag) => {
    const id = getId(data);
    return this.request({
      method: 'DELETE',
      path: [name, id, flag],
    });
  };

  private get = <T>(path, query?) => {
    return this.request<T>({
      method: 'GET',
      path,
      query,
    });
  };

  private getResources = <T extends Entity>(name, query?) => {
    return this.get<CollectionResponse<T>>([name], query);
  };

  private getResource = <T>(path, id?) => {
    return this.get<T>([path, id]);
  };

  private deleteResource = async (name, data) => {
    await this.request({
      method: 'DELETE',
      path: [name, getId(data)],
    });
    // Resolve with nothing.
  };

  private createResource = (name, data, headers?) => {
    const id = getId(data);
    const method = id ? 'PUT' : 'POST';

    return this.request(
      {
        method,
        path: [name, id],
        data,
      },
      headers
    );
  };

  private updateResource = (path, data) => {
    return this.request({
      method: 'PUT',
      path: [path, getId(data)],
      data,
      version: getVersion(data),
    });
  };
}

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
