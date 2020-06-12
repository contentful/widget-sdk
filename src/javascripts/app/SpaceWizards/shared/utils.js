import { get } from 'lodash';

import pluralize from 'pluralize';
import client from 'services/client';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { createApiKeyRepo } from 'features/api-keys-management';
import * as TokenStore from 'services/TokenStore';
import * as Analytics from 'analytics/Analytics';
import { getCreator as getTemplateCreator } from 'services/SpaceTemplateCreator';
import { getTemplate } from 'services/SpaceTemplateLoader';
import { go } from 'states/Navigator';
import { getModule } from 'core/NgRegistry';
import { joinWithAnd } from 'utils/StringUtils';
import { canCreate, resourceHumanNameMap } from 'utils/ResourceUtils';
import { changeSpacePlan as changeSpacePlanApiCall } from 'account/pricing/PricingDataProvider';

// Threshold for usage limit displaying/causing an error (100% usage e.g. limit reached)
const ERROR_THRESHOLD = 1;

// Threshold for usage limit displaying a warning (80% usage, e.g. near limit)
const WARNING_THRESHOLD = 0.8;

export const FREE_SPACE_IDENTIFIER = 'free_space';

export const SpaceResourceTypes = {
  Environments: 'Environments',
  Roles: 'Roles',
  Locales: 'Locales',
  ContentTypes: 'Content types',
  Records: 'Records',
};

const ResourceTooltips = {
  // eslint-disable-next-line react/prop-types
  [SpaceResourceTypes.Environments]: ({ number }) =>
    `This space type includes 1 master and ${pluralize('sandbox environment', number - 1, true)}.`,
  [SpaceResourceTypes.Records]: () => 'Records are entries and assets combined.',
};

async function makeNewSpace(name, plan, organizationId) {
  const spaceData = {
    defaultLocale: 'en-US',
    name,
    productRatePlanId: get(plan, 'sys.id'),
  };

  const newSpace = await client.createSpace(spaceData, organizationId);

  await TokenStore.refresh();

  trackWizardEvent('space_create', {
    action: 'create',
    spaceId: newSpace.sys.id,
  });

  return newSpace;
}

export async function createSpaceWithTemplate({
  name,
  plan,
  organizationId,
  template,
  onTemplateCreationStarted,
}) {
  const $rootScope = getModule('$rootScope');

  const newSpace = await makeNewSpace(name, plan, organizationId);
  onTemplateCreationStarted();

  // This needs to come before creating the template, so that we have `spaceContext`
  // correctly set.
  await go({
    path: ['spaces', 'detail'],
    params: { spaceId: newSpace.sys.id },
  });

  Analytics.track('space:create', {
    templateName: template.name,
    entityAutomationScope: { scope: 'space_template' },
  });

  await createTemplate(template);

  $rootScope.$broadcast('spaceTemplateCreated');

  return newSpace;
}

export async function createSpace({ name, plan, organizationId }) {
  const newSpace = await makeNewSpace(name, plan, organizationId);

  Analytics.track('space:create', { templateName: 'Blank' });

  const spaceEndpoint = createSpaceEndpoint(newSpace.sys.id);
  const apiKeyRepo = createApiKeyRepo(spaceEndpoint);

  await apiKeyRepo.create(
    'Example Key',
    'We’ve created an example API key for you to help you get started.'
  );

  await go({
    path: ['spaces', 'detail'],
    params: { spaceId: newSpace.sys.id },
  });

  return newSpace;
}

export async function changeSpacePlan({ space, plan }) {
  const endpoint = createSpaceEndpoint(space.sys.id);

  await changeSpacePlanApiCall(endpoint, plan.sys.id);

  trackWizardEvent('space_type_change', { action: 'change', spaceId: space.sys.id });
}

export function goToBillingPage(organization, onClose) {
  const orgId = organization.sys.id;

  go({
    path: ['account', 'organizations', 'subscription_billing'],
    params: { orgId, pathSuffix: '/billing_address' },
    options: { reload: true },
  });

  trackWizardEvent('link_click');
  onClose && onClose();
}

export function transformSpaceRatePlans({ organization, spaceRatePlans = [], freeSpaceResource }) {
  return spaceRatePlans.map((plan) => {
    const isFree = plan.productPlanType === 'free_space';
    const includedResources = getIncludedResources(plan.productRatePlanCharges);
    let disabled = false;
    let current = false;

    if (plan.unavailabilityReasons && plan.unavailabilityReasons.length > 0) {
      disabled = true;
    } else if (isFree) {
      disabled = !canCreate(freeSpaceResource);
    } else if (!organization.isBillable) {
      disabled = true;
    }

    if (
      plan.unavailabilityReasons &&
      plan.unavailabilityReasons.some((reason) => reason.type === 'currentPlan')
    ) {
      current = true;
    }

    return { ...plan, isFree, includedResources, disabled, current };
  });
}

export function trackWizardEvent(eventName, payload = {}) {
  const trackingData = createTrackingData(payload);

  Analytics.track(`space_wizard:${eventName}`, trackingData);
}

function createTrackingData(data) {
  const {
    action,
    paymentDetailsExist,
    currentStepId,
    targetStepId,
    selectedPlan,
    currentPlan,
    recommendedPlan,
    newSpaceName,
    newSpaceTemplate,
    spaceId,
  } = data;

  const trackingData = {
    currentStep: currentStepId || null,
    targetStep: targetStepId || null,
    intendedAction: action,
    paymentDetailsExist: typeof paymentDetailsExist === 'boolean' ? paymentDetailsExist : null,
    targetSpaceType: get(selectedPlan, 'internalName', null),
    targetProductType: get(selectedPlan, 'productType', null),
    targetSpaceName: newSpaceName || null,
    targetSpaceTemplateId: get(newSpaceTemplate, 'name', null),
    currentSpaceType: get(currentPlan, 'internalName', null),
    currentProductType: get(currentPlan, 'productType', null),
    recommendedSpaceType: get(recommendedPlan, 'internalName', null),
    recommendedProductType: get(recommendedPlan, 'productType', null),
  };

  if (spaceId) {
    trackingData.spaceId = spaceId;
  }

  return trackingData;
}

export function getIncludedResources(charges) {
  const ResourceTypes = {
    Environments: 'Environments',
    Roles: 'Roles',
    Locales: 'Locales',
    ContentTypes: 'Content types',
    Records: 'Records',
  };

  return Object.values(ResourceTypes).map((type) => {
    const charge = charges.find(({ name }) => name === type);
    let number = get(charge, 'tiers[0].endingUnit');

    // Add "extra" environment and role to include `master` and `admin`
    if ([ResourceTypes.Environments, ResourceTypes.Roles].includes(type)) {
      number = number + 1;
    }

    return { type, number };
  });
}

export function getHighestPlan(spaceRatePlans) {
  return [...spaceRatePlans].sort(
    // Handle the case where price isn't in the plan object, and default it to neg. infinity so that it will always
    // be sorted to the end
    ({ price: planXPrice = -Infinity }, { price: planYPrice = -Infinity }) =>
      planYPrice - planXPrice
  )[0];
}

export function getTooltip(type, number) {
  return ResourceTooltips[type] && ResourceTooltips[type]({ number });
}

export function getRolesTooltip(limit, roleSet) {
  const roles = ['Admin', ...roleSet.roles];
  // all roles joined by comma and `and`
  const rolesString = joinWithAnd(roles);
  const pluralized = pluralize('role', roles.length);
  const hasAdminOnly = limit === 1;

  // has many translator roles
  const translator = 'Translator';
  const translatorRolesCount = roles.filter((name) => name.includes(translator)).length;
  const withoutTranslator = roles.filter((name) => !name.includes(translator)).join(', ');
  const hasMultipleTranslators = translatorRolesCount > 1;

  // has limits greater than number of roles in role set
  const hasCustomRoles = limit > roles.length;
  const customRolesNumber = limit - roles.length;
  const customRolesString = `${customRolesNumber > 1 ? customRolesNumber : ''} ${pluralize(
    'custom roles',
    customRolesNumber
  )}`;

  const intro = 'This space type includes the';

  if (hasAdminOnly) {
    return `${intro} Admin role only`;
  } else if (hasMultipleTranslators) {
    // e.g. [...] Admin, Editor, and 10 Translator roles
    return `${intro} ${withoutTranslator}, and ${translatorRolesCount} Translator roles`;
  } else if (hasCustomRoles) {
    // e.g. [...] Admin, Editor, and an additional 10 custom roles
    return `${intro} ${rolesString} ${pluralized} and an additional ${customRolesString}`;
  } else {
    // e.g. [...] Admin, Editor, and Translator roles
    return `${intro} ${rolesString} ${pluralized}`;
  }
}

export async function sendParnershipEmail(spaceId, fields) {
  const endpoint = createSpaceEndpoint(spaceId);

  await endpoint({
    method: 'POST',
    path: ['partner_projects'],
    data: {
      clientName: get(fields, 'clientName', ''),
      projectDescription: get(fields, 'projectDescription', ''),
      estimatedDeliveryDate: get(fields, 'estimatedDeliveryDate', ''),
    },
  });
}

/*
  Returns the space plan relative resource usage information (resource fulfillment) based on
  the current resource usage.

  Returns an object, keyed by the resource name, which has values that are objects with
  two keys, `reached` and `near`:

  {
    'Content types': {
      reached: true,
      near: true
    },
    'Environments': {
      reached: false,
      near: true
    }
  }

  `reached` denotes that, if the user were to change to this space plan, that they would
  either be at the limit or over the limit, which means it doesn't make sense to recommend them
  this space plan.

  `near` denotes that, if the user were to change to this space plan, that they would not be at
  the limit, but would be near it and should be aware during the recommendation process.

 */
export function getPlanResourceFulfillment(plan, spaceResources = []) {
  const planIncludedResources = plan.includedResources;

  return planIncludedResources.reduce((fulfillments, planResource) => {
    const typeLower = planResource.type.toLowerCase();
    const spaceResource = spaceResources.find((r) => {
      const mappedId = resourceHumanNameMap[get(r, 'sys.id')].toLowerCase();

      return mappedId === typeLower;
    });

    if (!spaceResource) {
      return fulfillments;
    } else {
      const usagePercentage = spaceResource.usage / planResource.number;

      if (usagePercentage >= ERROR_THRESHOLD) {
        fulfillments[planResource.type] = {
          reached: true,
          near: true,
        };
      } else if (usagePercentage >= WARNING_THRESHOLD) {
        fulfillments[planResource.type] = {
          reached: false,
          near: true,
        };
      } else {
        fulfillments[planResource.type] = {
          reached: false,
          near: false,
        };
      }

      return fulfillments;
    }
  }, {});
}

/*
  Returns the plan that would fulfill your resource usage, given a set of space rate plans and
  the current space resources (usage/limits).
 */
export function getRecommendedPlan(currentPlan, spaceRatePlans = [], resources) {
  // We do not recommend a plan if the user isn't near (also hasn't reached) their limits
  const canRecommend = !!Object.values(getPlanResourceFulfillment(currentPlan, resources)).find(
    ({ reached, near }) => reached || near
  );

  if (!canRecommend) {
    return null;
  }

  // Valid plans are only ones that have no unavailablilty reasons
  const validPlans = spaceRatePlans.filter((plan) => !get(plan, 'unavailabilityReasons'));

  if (!resources || validPlans.length === 0) {
    return null;
  }

  // Find the first plan that has all true fulfillments, e.g. the status is "true" for all of the given fulfillments
  // for a given space rate plan, which means the plan fulfills the given resource usage
  const recommendedPlan = validPlans.find((plan) => {
    const statuses = Object.values(getPlanResourceFulfillment(plan, resources));

    if (statuses.length === 0) {
      return false;
    }

    return statuses.reduce((fulfills, { reached }) => fulfills && !reached, true);
  });

  if (!recommendedPlan) {
    return null;
  }

  return recommendedPlan;
}

async function createTemplate(templateInfo) {
  const spaceContext = getModule('spaceContext');

  const defaultLocale = 'en-US';

  const templateCreator = getTemplateCreator(
    spaceContext,
    { onItemSuccess: () => {}, onItemError: () => {} },
    templateInfo,
    defaultLocale
  );

  const templateData = await getTemplate(templateInfo);
  await tryCreateTemplate(templateCreator, templateData);

  await spaceContext.publishedCTs.refresh();
}

async function tryCreateTemplate(templateCreator, templateData, retried) {
  const { spaceSetup, contentCreated } = templateCreator.create(templateData);

  try {
    await Promise.all([
      // we suppress errors, since `contentCreated` will handle them
      spaceSetup.catch(() => {}),
      contentCreated,
    ]);
  } catch (err) {
    if (!retried) {
      return tryCreateTemplate(templateCreator, err.template, true);
    }

    throw err;
  }
}
