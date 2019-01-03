import { runTask } from 'utils/Concurrent.es6';
import {
  getSpaceInfo,
  getOrg,
  checkSpaceApiAccess,
  checkOrgAccess,
  getOnboardingSpaceId
} from './utils.es6';
import { isLegacyOrganization } from 'utils/ResourceUtils.es6';
import { getStoragePrefix } from 'components/shared/auto_create_new_space/CreateModernOnboarding.es6';
import { getStore } from 'TheStore/index.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const logger = getModule('logger');

const store = getStore();

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
  // we map links from `link` queryParameter to resolve fn
  // keys are quoted for consistency, you can use special symbols
  //
  // Please document all possible links in the wiki
  // https://contentful.atlassian.net/wiki/spaces/PROD/pages/208765005/Deeplinking+in+the+Webapp
  const mappings = {
    home: resolveHome,
    api: resolveApi,
    extensions: resolveExtensions,
    'install-extension': resolveInstallExtension,
    invite: resolveInviteUser,
    users: resolveUsers,
    subscription: resolveSubscriptions,
    org: resolveOrganizationInfo,
    'onboarding-get-started': createOnboardingScreenResolver('getStarted'),
    'onboarding-copy': createOnboardingScreenResolver('copy'),
    'onboarding-explore': createOnboardingScreenResolver('explore'),
    'onboarding-deploy': createOnboardingScreenResolver('deploy'),
    'webhook-template': resolveWebhookTemplate,
    apps: resolveApps
  };

  const resolverFn = mappings[link];

  if (resolverFn) {
    return resolverFn(params);
  } else {
    return Promise.reject(new Error('path does not exist'));
  }
}

function createOnboardingScreenResolver(screen) {
  return () =>
    runTask(function*() {
      const spaceId = yield* getOnboardingSpaceId();

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
    });
}

// resolve Home page
// always redirects directly to the home screen
// if you just redirect to `/`, you might end up on the
// content screen, this deeplink route solves it
function resolveHome() {
  return runTask(function*() {
    const { space, spaceId } = yield* getSpaceInfo();
    yield spaceContext.resetWithSpace(space);

    return {
      path: ['spaces', 'detail', 'home'],
      params: { spaceId }
    };
  });
}

// resolve API page
// in case we have no keys, we show page there
// users can add a new key
function resolveApi() {
  return runTask(function*() {
    const { space, spaceId } = yield* getSpaceInfo();
    yield spaceContext.resetWithSpace(space);

    // we need to set up space first, so accesses will be
    // updated for this specific space
    const hasAccess = checkSpaceApiAccess();

    if (!hasAccess) {
      throw new Error('user is not authorized');
    }

    const apiKeys = yield spaceContext.apiKeyRepo.getAll();

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
  });
}

function resolveExtensions() {
  return runTask(function*() {
    const { space, spaceId } = yield* getSpaceInfo();
    yield spaceContext.resetWithSpace(space);
    return {
      path: ['spaces', 'detail', 'settings', 'extensions'],
      params: { spaceId }
    };
  });
}

function resolveInstallExtension({ url, referrer }) {
  return runTask(function*() {
    if (!url) {
      throw new Error(`Extension URL was not specified in the link you've used.`);
    }
    const { space, spaceId } = yield* getSpaceInfo();
    yield spaceContext.resetWithSpace(space);
    return {
      path: ['spaces', 'detail', 'settings', 'extensions', 'list'],
      params: {
        spaceId,
        extensionUrl: url,
        referrer: referrer ? `deeplink-${referrer}` : 'deeplink'
      }
    };
  });
}

function resolveInviteUser() {
  return runTask(function*() {
    const { orgId } = yield* getOrg();
    return yield* applyOrgAccess(orgId, {
      path: ['account', 'organizations', 'users', 'new'],
      params: { orgId }
    });
  });
}

function resolveUsers() {
  return runTask(function*() {
    const { orgId } = yield* getOrg();
    return yield* applyOrgAccess(orgId, {
      path: ['account', 'organizations', 'users', 'list'],
      params: { orgId, pathSuffix: '' }
    });
  });
}

function resolveSubscriptions() {
  return runTask(function*() {
    const { orgId, org } = yield* getOrg();

    const hasNewPricing = !isLegacyOrganization(org);

    return yield* applyOrgAccess(orgId, {
      path: ['account', 'organizations', hasNewPricing ? 'subscription_new' : 'subscription'],
      params: {
        orgId,
        // dummy pathsuffix since we don't want to redirect
        // to purchase page
        pathSuffix: ''
      }
    });
  });
}

function resolveOrganizationInfo() {
  return runTask(function*() {
    const { orgId } = yield* getOrg();
    return yield* applyOrgAccess(orgId, {
      path: ['account', 'organizations', 'edit'],
      params: {
        orgId,
        pathSuffix: ''
      }
    });
  });
}

// return result only if user has access to organization settings
function* applyOrgAccess(orgId, successResult) {
  // user should be owner or admin to access this section
  const hasAccess = yield* checkOrgAccess(orgId);

  if (!hasAccess) {
    throw new Error('user is not authorized');
  }

  return successResult;
}

function resolveWebhookTemplate({ id, referrer }) {
  return runTask(function*() {
    if (!id) {
      throw new Error(`Webhook Template ID was not specified in the URL you've used.`);
    }
    const { spaceId } = yield* getSpaceInfo();
    return {
      path: ['spaces', 'detail', 'settings', 'webhooks', 'list'],
      params: { spaceId, templateId: id, referrer: referrer ? `deeplink-${referrer}` : 'deeplink' }
    };
  });
}

function resolveApps({ id }) {
  return runTask(function*() {
    const { spaceId } = yield* getSpaceInfo();

    if (id) {
      return {
        path: ['spaces', 'detail', 'apps', 'detail'],
        params: { spaceId, appId: id }
      };
    } else {
      return {
        path: ['spaces', 'detail', 'apps', 'list'],
        params: { spaceId }
      };
    }
  });
}
