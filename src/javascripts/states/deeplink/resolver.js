import { getSpaceInfo, getOrg, checkOrgAccess, getOnboardingSpaceId } from './utils';
import * as accessChecker from 'access_control/AccessChecker';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { getStoragePrefix } from 'components/shared/auto_create_new_space/CreateModernOnboarding';
import { getStore } from 'browserStorage';
import { getModule } from 'NgRegistry';
import { getOrganizationSpaces } from 'services/TokenStore';
import * as logger from 'services/logger';
import { getApiKeyRepo } from 'app/settings/api/services/ApiKeyRepoInstance';

const ONBOARDING_ERROR = 'modern onboarding space id does not exist';

/**
 * @description Given a string identifier we return a state reference (for our
 * ui router). This allows you to link to a resource type without knowning
 * the full path of that resource.
 *
 * @param {string} link - one of `api`, `invite`, `users`, `subscription`, `org`.
 * @param {object} params - All queryParameters except `link`
 * @return {Promise<{path:string, params:Object}>} - promise with resolved path and params
 */
export function resolveLink(link, params) {
  return resolveParams(link, params).catch(e => {
    logger.logException(e, {
      data: {
        link
      },
      groupingHash: 'Error during deeplink redirect'
    });
    return {
      onboarding: e.message === ONBOARDING_ERROR
    };
  });
}

/**
 * @param {string} link Deeplink name
 * @param {object} params All queryParameters except, `link`
 * @description function to get all needed params
 * we assume this is a first page user is landed,
 * so nothing is available yet, so we download everything
 */
function resolveParams(link, params) {
  try {
    // we map links from `link` queryParameter to resolve fn
    // keys are quoted for consistency, you can use special symbols
    //
    // Please document all possible links in the wiki
    // https://contentful.atlassian.net/wiki/spaces/PROD/pages/208765005/Deeplinking+in+the+Webapp
    const mappings = {
      // space scoped deeplinks
      api: resolveApi,
      'install-extension': resolveInstallExtension,
      'webhook-template': resolveWebhookTemplate,
      apps: resolveApps,
      home: makeSpaceScopedPathResolver({ spaceScopedPath: ['spaces', 'detail', 'home'] }),
      'general-settings': makeSpaceScopedPathResolver({
        spaceScopedPath: ['spaces', 'detail', 'settings', 'space']
      }),
      locales: makeSpaceScopedPathResolver({
        spaceScopedPath: ['spaces', 'detail', 'settings', 'locales', 'list']
      }),
      environments: makeSpaceScopedPathResolver({
        spaceScopedPath: ['spaces', 'detail', 'settings', 'environments']
      }),
      'roles-and-permissions': makeSpaceScopedPathResolver({
        spaceScopedPath: ['spaces', 'detail', 'settings', 'roles', 'list']
      }),
      'content-preview': makeSpaceScopedPathResolver({
        spaceScopedPath: ['spaces', 'detail', 'settings', 'content_preview', 'list']
      }),
      content: makeSpaceScopedPathResolver({
        spaceScopedPath: ['spaces', 'detail', 'entries', 'list']
      }),
      media: makeSpaceScopedPathResolver({
        spaceScopedPath: ['spaces', 'detail', 'assets', 'list']
      }),
      'content-model': makeSpaceScopedPathResolver({
        spaceScopedPath: ['spaces', 'detail', 'content_types', 'list']
      }),
      extensions: makeSpaceScopedPathResolver({
        spaceScopedPath: ['spaces', 'detail', 'settings', 'extensions', 'list']
      }),
      'onboarding-get-started': createOnboardingScreenResolver('getStarted'),
      'onboarding-copy': createOnboardingScreenResolver('copy'),
      'onboarding-explore': createOnboardingScreenResolver('explore'),
      'onboarding-deploy': createOnboardingScreenResolver('deploy'),
      // org scoped deeplinks
      invite: makeOrgScopedPathResolver({
        orgScopedPath: ['account', 'organizations', 'users', 'new']
      }),
      users: makeOrgScopedPathResolver({
        orgScopedPath: ['account', 'organizations', 'users', 'list'],
        pathSuffix: ''
      }),
      org: makeOrgScopedPathResolver({
        orgScopedPath: ['account', 'organizations', 'edit'],
        pathSuffix: ''
      }),
      subscription: resolveSubscriptions,
      'invitation-accepted': resolveSpaceHome
    };

    const resolverFn = mappings[link];

    if (resolverFn) {
      return resolverFn(params);
    } else {
      return Promise.reject(new Error('path does not exist'));
    }
  } catch (err) {
    return Promise.reject(err);
  }
}

function makeSpaceScopedPathResolver({ spaceScopedPath }) {
  if (!spaceScopedPath || !Array.isArray(spaceScopedPath)) {
    throw new Error('A path for a deeplink to resolve to must be provided');
  }

  if (!spaceScopedPath.includes('spaces')) {
    throw new Error('A space scoped path must be nested under "spaces"');
  }

  return async function() {
    const { space, spaceId } = await getSpaceInfo();
    const spaceContext = getModule('spaceContext');
    await spaceContext.resetWithSpace(space);
    return {
      path: spaceScopedPath,
      params: { spaceId }
    };
  };
}

function createOnboardingScreenResolver(screen) {
  return async function() {
    const store = getStore();

    const spaceId = await getOnboardingSpaceId();

    if (spaceId) {
      const currentStepKey = `${getStoragePrefix()}:currentStep`;
      // we set current step flag in local storage, so if we click "skip"
      // and resume the flow later, it opens the same step
      store.set(currentStepKey, {
        path: `spaces.detail.onboarding.${screen}`,
        params: { spaceId }
      });
      return {
        path: ['spaces', 'detail', 'onboarding', screen],
        params: { spaceId }
      };
    } else {
      throw new Error(ONBOARDING_ERROR);
    }
  };
}

// resolve API page
// in case we have no keys, we show page there
// users can add a new key
async function resolveApi() {
  const { space, spaceId } = await getSpaceInfo();
  const spaceContext = getModule('spaceContext');
  await spaceContext.resetWithSpace(space);

  // we need to set up space first, so accesses will be
  // updated for this specific space
  const hasAccess = accessChecker.canReadApiKeys();

  if (!hasAccess) {
    throw new Error('user is not authorized');
  }

  const apiKeys = await getApiKeyRepo().getAll();

  if (!apiKeys || apiKeys.length === 0) {
    return {
      path: ['spaces', 'detail', 'api', 'keys', 'list'],
      params: { spaceId }
    };
  }

  return {
    path: ['spaces', 'detail', 'api', 'keys', 'detail'],
    params: {
      spaceId,
      apiKeyId: apiKeys[0].sys.id
    }
  };
}

async function resolveInstallExtension({ url, referrer }) {
  if (!url) {
    throw new Error(`Extension URL was not specified in the link you've used.`);
  }
  const { space, spaceId } = await getSpaceInfo();
  const spaceContext = getModule('spaceContext');
  await spaceContext.resetWithSpace(space);
  return {
    path: ['spaces', 'detail', 'environment', 'settings', 'extensions', 'list'],
    params: {
      spaceId,
      environmentId: 'master',
      referrer: referrer ? `deeplink-${referrer}` : 'deeplink',
      ...(url ? { extensionUrl: url } : {})
    },
    deeplinkOptions: {
      selectSpace: true,
      selectEnvironment: true
    }
  };
}

/**
 * Supported ids:
 * -------------------
 * netlify-deploy-site
 * heroku-trigger-build
 * travis-ci-trigger-build
 * circle-ci-trigger-build
 * gitlab-trigger-pipeline
 * bitbucket-trigger-pipeline
 * aws-lambda-call-function
 * google-cloud-invoke-function
 * webtask-run-function
 * slack-post-message
 * twilio-send-sms
 * mailgun-send-mail
 * aws-sqs-send-message
 * pubnub-publish-msg
 * aws-s3-store-entries
 * algolia-index-entries
 * elasticsearch-index-entries
 * jira-create-task
 */
async function resolveWebhookTemplate({ id, referrer }) {
  if (!id) {
    throw new Error(`Webhook Template ID was not specified in the URL you've used.`);
  }
  const { spaceId } = await getSpaceInfo();
  return {
    path: ['spaces', 'detail', 'settings', 'webhooks', 'list'],
    params: {
      spaceId,
      referrer: referrer ? `deeplink-${referrer}` : 'deeplink',
      ...(id ? { templateId: id } : {})
    },
    deeplinkOptions: {
      selectSpace: true
    }
  };
}

async function resolveApps({ id, referrer }) {
  const { spaceId } = await getSpaceInfo();

  return {
    path: ['spaces', 'detail', 'environment', 'apps', 'list'],
    params: {
      spaceId,
      environmentId: 'master',
      referrer: referrer ? `deeplink-${referrer}` : 'deeplink',
      ...(id ? { appId: id } : {})
    },
    deeplinkOptions: {
      selectSpace: true,
      selectEnvironment: true
    }
  };
}

function makeOrgScopedPathResolver({ orgScopedPath, pathSuffix = null }) {
  if (!orgScopedPath || !Array.isArray(orgScopedPath)) {
    throw new Error('A path for a deeplink to resolve to must be provided');
  }

  if (!orgScopedPath.includes('organizations')) {
    throw new Error('An org scoped path must contain "organizations"');
  }

  return async function() {
    const { orgId } = await getOrg();
    const params = pathSuffix === null ? { orgId } : { orgId, pathSuffix };

    return await applyOrgAccess(orgId, {
      path: orgScopedPath,
      params
    });
  };
}

async function resolveSubscriptions() {
  const { orgId, org } = await getOrg();

  const hasNewPricing = !isLegacyOrganization(org);

  return applyOrgAccess(orgId, {
    path: ['account', 'organizations', hasNewPricing ? 'subscription_new' : 'subscription'],
    params: {
      orgId,
      // dummy pathsuffix since we don't want to redirect
      // to purchase page
      pathSuffix: ''
    }
  });
}

async function resolveSpaceHome({ orgId }) {
  const space = await getOrganizationSpaces(orgId);
  if (!space) {
    throw new Error('no spaces found');
  }
  const spaceId = space.sys.id;
  return {
    path: ['spaces', 'detail', 'home'],
    params: {
      spaceId
    }
  };
}

// return result only if user has access to organization settings
async function applyOrgAccess(orgId, successResult) {
  // user should be owner or admin to access this section
  const hasAccess = await checkOrgAccess(orgId);

  if (!hasAccess) {
    throw new Error('user is not authorized');
  }

  return successResult;
}
