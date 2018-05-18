import spaceContext from 'spaceContext';
import {runTask} from 'utils/Concurrent';
import {getSpaceInfo, getOrg, checkSpaceApiAccess, checkOrgAccess} from './utils';
import logger from 'logger';
import {isLegacyOrganization} from 'utils/ResourceUtils';

/**
 * @description Given a string identifier we return a state reference (for our
 * ui router). This allows you to link to a resource type without knowning
 * the full path of that resource.
 *
 * @param {string} link - one of `api`, `invite`, `users`, `subscription`, `org`.
 * @return {Promise<{path:string, params:Object}>} - promise with resolved path and params
 */
export function resolveLink (link) {
  return resolveParams(link)
  .catch((e) => {
    logger.logException(e, {
      data: {
        link
      },
      groupingHash: 'Error during deeplink redirect'
    });
    return {};
  });
}

/**
 * @description function to get all needed params
 * we assume this is a first page user is landed,
 * so nothing is available yet, so we download everything
 */
function resolveParams (link) {
  // we map links from `link` queryParameter to resolve fn
  // keys are quoted, so we can use special symbols later
  const mappings = {
    'home': resolveHome,
    'api': resolveApi,
    'extensions': resolveExtensions,
    'invite': resolveInviteUser,
    'users': resolveUsers,
    'subscription': resolveSubscriptions,
    'org': resolveOrganizationInfo
  };

  const resolverFn = mappings[link];

  if (resolverFn) {
    return resolverFn();
  } else {
    return Promise.reject(new Error('path does not exist'));
  }
}

// resolve Home page
// always redirects directly to the home screen
// if you just redirect to `/`, you might end up on the
// content screen, this deeplink route solves it
function resolveHome () {
  return runTask(function* () {
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
function resolveApi () {
  return runTask(function* () {
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

function resolveExtensions () {
  return runTask(function* () {
    const { space, spaceId } = yield* getSpaceInfo();
    yield spaceContext.resetWithSpace(space);
    const isAdmin = !!spaceContext.getData('spaceMembership.admin', false);

    if (isAdmin) {
      return {
        path: ['spaces', 'detail', 'settings', 'extensions'],
        params: { spaceId }
      };
    } else {
      throw new Error('user is not authorized');
    }
  });
}

function resolveInviteUser () {
  return runTask(function* () {
    const { orgId } = yield* getOrg();
    return yield* applyOrgAccess(orgId, {
      path: ['account', 'organizations', 'users', 'new'],
      params: { orgId }
    });
  });
}

function resolveUsers () {
  return runTask(function* () {
    const { orgId } = yield* getOrg();
    return yield* applyOrgAccess(orgId, {
      path: ['account', 'organizations', 'users', 'gatekeeper'],
      params: { orgId, pathSuffix: '' }
    });
  });
}

function resolveSubscriptions () {
  return runTask(function* () {
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

function resolveOrganizationInfo () {
  return runTask(function* () {
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
function* applyOrgAccess (orgId, successResult) {
  // user should be owner or admin to access this section
  const hasAccess = yield* checkOrgAccess(orgId);

  if (!hasAccess) {
    throw new Error('user is not authorized');
  }

  return successResult;
}
