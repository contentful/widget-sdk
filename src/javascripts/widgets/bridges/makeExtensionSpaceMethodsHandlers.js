import { get } from 'lodash';
import * as Analytics from 'analytics/Analytics';
import { getToken } from 'Authentication';
import { uploadApiUrl } from 'Config';
import ScheduledActionsRepo from 'app/ScheduledActions/DataManagement/ScheduledActionsRepo';
import { create as createTagsRepo } from 'features/content-tags/core/state/TagsRepo';
import checkDependencies from './checkDependencies';

const ASSET_PROCESSING_POLL_MS = 500;

const ALLOWED_TAG_METHODS = ['readTags', 'createTag', 'deleteTag', 'updateTag'];

// This list helps prevent unknown or malicious use of methods that exist on the cma
// by whitelisting only the actions we deem necessary
const ALLOWED_SDK_METHODS = [
  'getContentType',
  'getEntry',
  'getEntrySnapshots',
  'getAsset',
  'getEditorInterface',

  'getPublishedEntries',
  'getPublishedAssets',
  'getContentTypes',
  'getEntries',
  'getEditorInterfaces',
  'getAssets',

  'createContentType',
  'createEntry',
  'createAsset',

  'updateContentType',
  'updateEntry',
  'updateAsset',

  'deleteContentType',
  'deleteEntry',
  'deleteAsset',

  'publishEntry',
  'publishAsset',
  'unpublishEntry',
  'unpublishAsset',

  'archiveEntry',
  'archiveAsset',
  'unarchiveEntry',
  'unarchiveAsset',

  'createUpload',
  'processAsset',
  'waitUntilAssetProcessed',

  'getUsers',

  'getAllScheduledActions',
  'getEntityScheduledActions',

  // Alpha methods
  'getEntryReferences',
  'validateEntry',
  'validateRelease',
  'executeRelease',
  ...ALLOWED_TAG_METHODS,
];

export default function makeExtensionSpaceMethodsHandlers(dependencies, handlerOptions = {}) {
  const { spaceContext } = checkDependencies('ExtensionSpaceMethodsHandlers', dependencies, [
    'spaceContext',
  ]);

  const TagsRepo = createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId());

  return async function (methodName, args) {
    if (handlerOptions.readOnly === true) {
      // When rendering an extension in the read-only mode we disable
      // any mutating CMA calls. This is used in snapshots right now.
      if (typeof methodName !== 'string' || !methodName.startsWith('get')) {
        throw new Error('Cannot modify data in read-only mode.');
      }
    }

    try {
      if (!ALLOWED_SDK_METHODS.includes(methodName)) {
        throw new Error(`Method "${methodName}" does not exist.`);
      }

      // Users are fetched with the User Cache, not the CMA client.
      if (methodName === 'getUsers') {
        const users = await spaceContext.users.getAll();
        return prepareUsers(users);
      }

      if (methodName === 'createUpload') {
        return createUpload(spaceContext.getId(), args[0]);
      }

      if (methodName === 'waitUntilAssetProcessed') {
        return waitUntilAssetProcessed(spaceContext.cma, args[0], args[1]);
      }

      if (methodName === 'getEntityScheduledActions') {
        const entityType = args[0];
        const entityId = args[1];
        return ScheduledActionsRepo.getEntityScheduledActions(entityType, entityId);
      }

      if (methodName === 'getAllScheduledActions') {
        return ScheduledActionsRepo.getAllScheduledActions();
      }

      if (ALLOWED_TAG_METHODS.includes(methodName)) {
        return TagsRepo[methodName](...args);
      }

      // TODO: Use `getBatchingApiClient(spaceContext.cma)`.
      const entity = await spaceContext.cma[methodName](...args);
      maybeTrackEntryAction(methodName, args, entity);
      return entity;
    } catch ({ code, body }) {
      const err = new Error('Request failed.');
      throw Object.assign(err, { code, data: body });
    }
  };
}

function prepareUsers(users) {
  users = users || [];

  return {
    sys: { type: 'Array' },
    total: users.length,
    skip: 0,
    limit: users.length,
    items: users.map((user) => ({
      sys: { type: 'User', id: user.sys.id },
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    })),
  };
}

function maybeTrackEntryAction(methodName, args, entity) {
  try {
    if (get(entity, ['sys', 'type']) !== 'Entry') {
      return;
    }

    if (methodName === 'createEntry') {
      trackEntryAction('create', args[0], entity);
    } else if (methodName === 'publishEntry') {
      const contentTypeId = get(args[0], ['sys', 'contentType', 'sys', 'id']);
      trackEntryAction('publish', contentTypeId, entity);
    }
  } catch (err) {
    // Just catch and ignore, failing to track should not
    // demonstrate itself outside.
  }
}

function trackEntryAction(action, contentTypeId, data) {
  Analytics.track(`entry:${action}`, {
    eventOrigin: 'ui-extension',
    // Stub content type object:
    contentType: {
      sys: { id: contentTypeId, type: 'ContentType' },
      fields: [],
    },
    response: data,
  });
}

async function createUpload(spaceId, base64Data) {
  // Convert raw Base64 string to Uint8Array so we can post the binary to upload API
  const raw = window.atob(base64Data);
  const rawLength = raw.length;
  const binary = new Uint8Array(new ArrayBuffer(rawLength));

  for (let i = 0; i < rawLength; i++) {
    binary[i] = raw.charCodeAt(i);
  }

  const token = await getToken();

  // We're preferring `fetch` over `createEndpoint` to be able to send binary data
  return window
    .fetch(uploadApiUrl(`/spaces/${spaceId}/uploads`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${token}`,
      },
      body: binary,
    })
    .then((resp) => resp.json());
}

// Assets are processed asynchronously, so we have to poll the asset endpoint to wait until they're processed.
export async function waitUntilAssetProcessed(cmaClient, assetId, locale) {
  const asset = await cmaClient.getAsset(assetId);
  if (get(asset, ['fields', 'file', locale, 'url'])) {
    return asset;
  }

  await new Promise((resolve) => setTimeout(resolve, ASSET_PROCESSING_POLL_MS));
  return waitUntilAssetProcessed(cmaClient, assetId, locale);
}
