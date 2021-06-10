import { getSpaceInfo, getOrg, checkOrgAccess, getOnboardingSpaceId } from './utils';
import * as accessChecker from 'access_control/AccessChecker';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { getStoragePrefix } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getSpaceContext } from 'classes/spaceContext';
import { getOrganizationSpaces } from 'services/TokenStore';
import { captureError } from 'core/monitoring';
import { getApiKeyRepo } from 'features/api-keys-management';
import { routes } from 'core/react-routing';

export enum LinkType {
  API = 'api',
  Invite = 'invite',
  Subscription = 'subscription',
  Org = 'org',
  Apps = 'apps',
  AppsContentful = 'apps-contentful',
  AppDefinition = 'app-definition',
  AppDefinitionList = 'app-definition-list',
  InstallExtension = 'install-extension',
  WebhookTemplate = 'webhook-template',
  Home = 'home',
  GeneralSettings = 'general-settings',
  Locales = 'locales',
  Environments = 'environments',
  RolesAndPermissions = 'roles-and-permissions',
  ContentPreview = 'content-preview',
  Content = 'content',
  ContentModel = 'content-model',
  Media = 'media',
  Extensions = 'extensions',
  OnboardingGetStarted = 'onboarding-get-started',
  OnboardingCopy = 'onboarding-copy',
  OnboardingExplore = 'onboarding-explore',
  OnboardingDeploy = 'onboarding-deploy',
  Users = 'users',
  InvitationAccepted = 'invitation-accepted',
  StartAppTrial = 'start-trial',
  Tags = 'tags',
}

interface ResolvedLink {
  path: string[] | string;
  params: Record<string, any>;
}

/**
 * @description Given a string identifier we return a state reference (for our
 * ui router). This allows you to link to a resource type without knowning
 * the full path of that resource.
 */
export function resolveLink(
  link: LinkType,
  params: Record<string, any>
): Promise<ResolvedLink | { error: Error }> {
  return resolveParams(link, params).catch((error) => {
    captureError(error, {
      extra: { link },
    });
    return { error };
  });
}

// we map links from `link` queryParameter to resolve fn
// keys are quoted for consistency, you can use special symbols
//
// Please document all possible links in the wiki
// https://contentful.atlassian.net/wiki/spaces/PROD/pages/208765005/Deeplinking+in+the+Webapp
const mappings: Record<LinkType, (params: any) => Promise<ResolvedLink>> = {
  // space scoped deeplinks
  [LinkType.API]: resolveApi,
  [LinkType.InstallExtension]: resolveInstallExtension,
  [LinkType.WebhookTemplate]: resolveWebhookTemplate,
  [LinkType.Apps]: resolveApps,
  [LinkType.AppsContentful]: resolveContentfulApps,
  [LinkType.AppDefinition]: resolveAppDefinition,
  [LinkType.AppDefinitionList]: makeOrgScopedPathResolver((orgId) => {
    return routes['organizations.apps.list']({}, { orgId });
  }),
  [LinkType.Home]: makeSpaceScopedPathResolver({ spaceScopedPath: 'spaces.detail.home' }),
  [LinkType.GeneralSettings]: makeSpaceScopedPathResolver({
    spaceScopedPath: ['spaces', 'detail', 'settings', 'space'],
  }),
  [LinkType.Locales]: makeSpaceScopedPathResolver({
    spaceScopedPath: routes['locales.list']({ withEnvironment: false }).path,
    params: routes['locales.list']({ withEnvironment: false }).params,
  }),
  [LinkType.Environments]: makeSpaceScopedPathResolver({
    spaceScopedPath: routes['settings.environments']({ withEnvironment: false }).path,
    params: routes['settings.environments']({ withEnvironment: false }).params,
  }),
  [LinkType.RolesAndPermissions]: makeSpaceScopedPathResolver({
    spaceScopedPath: routes['roles.list']({ withEnvironment: false }).path,
    params: routes['roles.list']({ withEnvironment: false }).params,
  }),
  [LinkType.ContentPreview]: makeSpaceScopedPathResolver({
    spaceScopedPath: routes['content_preview.list']({ withEnvironment: false }).path,
    params: routes['content_preview.list']({ withEnvironment: false }).params,
  }),
  [LinkType.Content]: makeSpaceScopedPathResolver({
    spaceScopedPath: ['spaces', 'detail', 'entries', 'list'],
  }),
  [LinkType.Media]: makeSpaceScopedPathResolver({
    spaceScopedPath: routes['assets.list']({ withEnvironment: false }).path,
    params: routes['assets.list']({ withEnvironment: false }).params,
  }),
  [LinkType.ContentModel]: makeSpaceScopedPathResolver({
    spaceScopedPath: routes['content_types.list']({ withEnvironment: false }).path,
    params: routes['content_types.list']({ withEnvironment: false }).params,
  }),
  [LinkType.Extensions]: makeSpaceScopedPathResolver({
    spaceScopedPath: routes['extensions.list']({ withEnvironment: false }).path,
    params: routes['extensions.list']({ withEnvironment: false }).params,
  }),
  [LinkType.OnboardingGetStarted]: createOnboardingScreenResolver('getStarted'),
  [LinkType.OnboardingCopy]: createOnboardingScreenResolver('copy'),
  [LinkType.OnboardingExplore]: createOnboardingScreenResolver('explore'),
  [LinkType.OnboardingDeploy]: createOnboardingScreenResolver('deploy'),
  // org scoped deeplinks
  [LinkType.Invite]: makeOrgScopedPathResolver((orgId) => {
    return routes['organizations.users.invite']({}, { orgId });
  }),
  [LinkType.Users]: makeOrgScopedPathResolver((orgId) => {
    return routes['organizations.users.list']({}, { orgId });
  }),
  [LinkType.Org]: makeOrgScopedPathResolver((orgId) => {
    return routes['organizations.edit']({}, { orgId });
  }),
  [LinkType.Subscription]: resolveSubscriptions,
  [LinkType.InvitationAccepted]: resolveSpaceHome,
  [LinkType.StartAppTrial]: resolveAppsTrial,
  [LinkType.Tags]: makeSpaceScopedPathResolver({
    spaceScopedPath: routes['tags']({ withEnvironment: false }).path,
    params: routes['tags']({ withEnvironment: false }).params,
  }),
};

/**
 * @description function to get all needed params
 * we assume this is a first page user is landed,
 * so nothing is available yet, so we download everything
 */
function resolveParams(link: LinkType, params: Record<string, any>) {
  try {
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

function makeSpaceScopedPathResolver({
  spaceScopedPath,
  params,
}: {
  spaceScopedPath: string[] | string;
  params?: { [key: string]: unknown };
}): () => Promise<ResolvedLink> {
  if (!spaceScopedPath) {
    throw new Error('A path for a deeplink to resolve to must be provided');
  }

  if (!spaceScopedPath.includes('spaces')) {
    throw new Error('A space scoped path must be nested under "spaces"');
  }

  return async function () {
    const { space, spaceId } = await getSpaceInfo();
    const spaceContext = getSpaceContext();
    await spaceContext.resetWithSpace(space);
    return {
      path: spaceScopedPath,
      params: { spaceId, ...params },
    };
  };
}

function createOnboardingScreenResolver(screen) {
  return async function () {
    const store = getBrowserStorage();

    const spaceId = await getOnboardingSpaceId();

    if (spaceId) {
      const currentStepKey = `${getStoragePrefix()}:currentStep`;
      // we set current step flag in local storage, so if we click "skip"
      // and resume the flow later, it opens the same step
      store.set(currentStepKey, {
        path: `spaces.detail.onboarding.${screen}`,
        params: { spaceId },
      });
      return routes[`spaces.detail.onboarding.${screen}`]({}, { spaceId });
    } else {
      throw new OnboardingError();
    }
  };
}

// resolve API page
// in case we have no keys, we show page there
// users can add a new key
async function resolveApi() {
  const { space, spaceId } = await getSpaceInfo();
  const spaceContext = getSpaceContext();
  await spaceContext.resetWithSpace(space);

  // we need to set up space first, so accesses will be
  // updated for this specific space
  const hasAccess = accessChecker.canReadApiKeys();

  if (!hasAccess) {
    throw new Error('user is not authorized');
  }

  const apiKeys = await getApiKeyRepo().getAll();

  if (!apiKeys || apiKeys.length === 0) {
    const route = routes['api.keys.list']({ withEnvironment: false }, { spaceId });

    return {
      path: route.path,
      params: { ...route.params },
    };
  }

  const route = routes['api.keys.detail'](
    { withEnvironment: false },
    { apiKeyId: apiKeys[0].sys.id, spaceId }
  );

  return {
    path: route.path,
    params: {
      ...route.params,
    },
  };
}

async function resolveInstallExtension({ url, referrer }) {
  if (!url) {
    throw new Error(`Extension URL was not specified in the link you've used.`);
  }
  const { space, spaceId } = await getSpaceInfo();
  const spaceContext = getSpaceContext();
  await spaceContext.resetWithSpace(space);

  const route = routes['extensions.list'](
    { withEnvironment: true },
    {
      navigationState: {
        referrer: referrer ? `deeplink-${referrer}` : 'deeplink',
        ...(url ? { extensionUrl: url } : {}),
      },
    }
  );

  return {
    path: route.path,
    params: {
      ...route.params,
      spaceId,
      environmentId: 'master',
    },
    deeplinkOptions: {
      selectSpace: true,
      selectEnvironment: true,
    },
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
  const route = routes['webhooks.list'](
    { withEnvironment: false },
    {
      navigationState: {
        referrer: referrer ? `deeplink-${referrer}` : 'deeplink',
        ...(id ? { templateId: id } : {}),
      },
    }
  );
  return {
    path: route.path,
    params: {
      ...route.params,
      spaceId,
    },
    deeplinkOptions: {
      selectSpace: true,
    },
  };
}

async function resolveContentfulApps(params: {
  id?: string;
  referrer?: string;
  spaceId?: string;
  environmentId?: string;
}) {
  let spaceId;
  if (params.spaceId) {
    spaceId = params.spaceId;
  } else {
    spaceId = (await getSpaceInfo()).spaceId;
  }
  const environmentId = params.environmentId ? params.environmentId : 'master';

  const route = routes['apps.list'](
    { withEnvironment: Boolean(params.environmentId) },
    {
      spaceId,
      environmentId,
      ...(params.id ? { app: params.id } : {}),
      navigationState: {
        referrer: params.referrer ? `deeplink-${params.referrer}` : 'deeplink',
      },
    }
  );

  return {
    path: route.path,
    params: route.params,
  };
}

async function resolveApps(params: { id?: string; referrer?: string }) {
  const { spaceId } = await getSpaceInfo();

  const route = routes['apps.list'](
    { withEnvironment: false },
    {
      spaceId,
      environmentId: 'master',
      ...(params.id ? { app: params.id } : {}),
      navigationState: {
        referrer: params.referrer ? `deeplink-${params.referrer}` : 'deeplink',
      },
    }
  );

  return {
    path: route.path,
    params: route.params,
    deeplinkOptions: {
      selectSpace: true,
      selectEnvironment: true,
    },
  };
}

async function resolveAppDefinition({ id, tab, referrer }) {
  if (id) {
    const { orgId } = await getOrg();
    const definitionsRoute = routes['organizations.apps.definition'](
      {},
      { orgId, tab, definitionId: id }
    );
    return {
      path: definitionsRoute.path,
      referrer: referrer ? `deeplink-${referrer}` : 'deeplink',
      params: definitionsRoute.params,
    };
  } else {
    const { orgId } = await getOrg();
    const definitionsRoute = routes['organizations.apps.definition'](
      {},
      { orgId, tab, definitionId: '' }
    );
    return {
      path: definitionsRoute.path,
      referrer: referrer ? `deeplink-${referrer}` : 'deeplink',
      params: definitionsRoute.params,
      deeplinkOptions: {
        selectApp: true,
      },
    };
  }
}

function makeOrgScopedPathResolver(fn: (orgId: string) => { path: string; params: unknown }) {
  return async function () {
    const { orgId } = await getOrg();

    const { path, params } = fn(orgId);

    return await applyOrgAccess(orgId, {
      path,
      params,
    });
  };
}

async function resolveSubscriptions() {
  const { orgId, org } = await getOrg();

  const hasNewPricing = !isLegacyOrganization(org);

  if (!hasNewPricing) {
    return applyOrgAccess(orgId, routes['organizations.subscription_v1']({}, { orgId }));
  }

  return applyOrgAccess(orgId, {
    path: ['account', 'organizations', 'subscription_new.overview'],
    params: {
      orgId,
    },
  });
}

async function resolveAppsTrial({ referrer }) {
  const { orgId } = await getOrg();

  return applyOrgAccess(
    orgId,
    routes['account.organizations.start_trial'](
      {},
      {
        orgId,
        navigationState: {
          from: referrer ? `deeplink-${referrer}` : 'deeplink',
        },
      }
    )
  );
}

async function resolveSpaceHome({ orgId }) {
  const spaces = await getOrganizationSpaces(orgId);
  if (spaces.length === 0) {
    const orgOwnerOrAdmin = await checkOrgAccess(orgId);
    return {
      path: ['home'],
      params: { orgId: orgId, orgOwnerOrAdmin: orgOwnerOrAdmin },
    };
  }
  const spaceId = spaces[0].sys.id;

  const route = routes['spaces.detail.home'](
    { withEnvironment: false },
    {
      spaceId,
    }
  );

  return {
    path: route.path,
    params: route.params,
  };
}

// return result only if user has access to organization settings
async function applyOrgAccess(orgId: string, successResult) {
  // user should be owner or admin to access this section
  const hasAccess = await checkOrgAccess(orgId);

  if (!hasAccess) {
    throw new Error('user is not authorized');
  }

  return successResult;
}

class OnboardingError extends Error {
  public readonly isOnboardingError = true;

  constructor() {
    super('modern onboarding space id does not exist');
  }
}
