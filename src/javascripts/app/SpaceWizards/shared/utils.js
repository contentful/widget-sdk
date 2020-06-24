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
import { canCreate, resourceHumanNameMap, getResourceLimits } from 'utils/ResourceUtils';
import { changeSpacePlan as changeSpacePlanApiCall } from 'account/pricing/PricingDataProvider';

export const WIZARD_INTENT = {
  CHANGE: 'change',
  CREATE: 'create',
};

export const WIZARD_EVENTS = {
  OPEN: 'open',
  SELECT_PLAN: 'select_plan',
  NAVIGATE: 'navigate',
  ENTERED_DETAILS: 'entered_details',
  CANCEL: 'cancel',
  LINK_CLICK: 'link_click',
  CONFIRM: 'confirm',
  SPACE_CREATE: 'space_create',
  SPACE_TYPE_CHANGE: 'space_type_change',
};

// Threshold for usage limit displaying/causing an error (100% usage e.g. limit reached)
const ERROR_THRESHOLD = 1;

// Threshold for usage limit displaying a warning (80% usage, e.g. near limit)
const WARNING_THRESHOLD = 0.8;

export const FREE_SPACE_IDENTIFIER = 'free_space';

// These are the resources we specifically care about when recommending
const RECOMMENDATION_RESOURCE_TYPES = ['environment', 'content_type', 'record', 'locale'];

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

async function makeNewSpace(name, plan, organizationId, sessionId) {
  const spaceData = {
    defaultLocale: 'en-US',
    name,
    productRatePlanId: get(plan, 'sys.id'),
  };

  const newSpace = await client.createSpace(spaceData, organizationId);

  await TokenStore.refresh();

  trackWizardEvent(WIZARD_INTENT.CREATE, WIZARD_EVENTS.SPACE_CREATE, sessionId, {
    spaceId: newSpace.sys.id,
  });

  return newSpace;
}

export async function createSpaceWithTemplate({
  name,
  plan,
  organizationId,
  sessionId,
  template,
  onTemplateCreationStarted,
}) {
  const $rootScope = getModule('$rootScope');

  const newSpace = await makeNewSpace(name, plan, organizationId, sessionId);
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

export async function createSpace({ name, plan, organizationId, sessionId }) {
  const newSpace = await makeNewSpace(name, plan, organizationId, sessionId);

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

export async function changeSpacePlan({ space, plan, sessionId }) {
  const endpoint = createSpaceEndpoint(space.sys.id);

  await changeSpacePlanApiCall(endpoint, plan.sys.id);

  trackWizardEvent(WIZARD_INTENT.CHANGE, WIZARD_EVENTS.SPACE_TYPE_CHANGE, sessionId, {
    spaceId: space.sys.id,
  });
}

export function goToBillingPage(organization, intent, sessionId, onClose) {
  const orgId = organization.sys.id;

  go({
    path: ['account', 'organizations', 'subscription_billing'],
    params: { orgId, pathSuffix: '/billing_address' },
    options: { reload: true },
  });

  trackWizardEvent(intent, WIZARD_EVENTS.LINK_CLICK, sessionId);
  onClose && onClose();
}

export function transformSpaceRatePlan({ organization, plan, freeSpaceResource }) {
  const isFree = plan.productPlanType === 'free_space';
  const includedResources = getIncludedResources(plan.productRatePlanCharges);
  let disabled = false;

  if (plan.unavailabilityReasons && plan.unavailabilityReasons.length > 0) {
    disabled = true;
  } else if (isFree) {
    disabled = !canCreate(freeSpaceResource);
  } else if (!organization.isBillable) {
    disabled = true;
  }

  return { ...plan, isFree, includedResources, disabled };
}

export function transformSpaceRatePlans({ organization, spaceRatePlans = [], freeSpaceResource }) {
  return spaceRatePlans.map((plan) =>
    transformSpaceRatePlan({ organization, plan, freeSpaceResource })
  );
}

export function trackWizardEvent(intent, eventName, sessionId, payload = {}) {
  const trackingData = createTrackingData(intent, sessionId, payload);

  Analytics.track(`space_wizard:${eventName}`, trackingData);
}

function createTrackingData(intent, sessionId, data) {
  const {
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
    intendedAction: intent,
    wizardSessionId: sessionId,
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
  return Object.values(SpaceResourceTypes).map((type) => {
    const charge = charges.find(({ name }) => name === type);
    let number = get(charge, 'tiers[0].endingUnit');

    // Add "extra" environment and role to include `master` and `admin`
    if ([SpaceResourceTypes.Environments, SpaceResourceTypes.Roles].includes(type)) {
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

function usageAtErrorThreshold(resource) {
  return resource.usage / getResourceLimits(resource).maximum >= ERROR_THRESHOLD;
}

function usageAtWarningThreshold(resource) {
  return resource.usage / getResourceLimits(resource).maximum >= WARNING_THRESHOLD;
}

function shouldRecommendPlan(resources) {
  // We shouldn't recommend a plan if the user isn't near (also hasn't reached) their limits
  return RECOMMENDATION_RESOURCE_TYPES.reduce((shouldRecommend, type) => {
    if (shouldRecommend) {
      return true;
    }

    const resource = resources.find((r) => r.sys.id === type);

    if (!resource) {
      // Ignore if the resource is missing from the API
      return false;
    }

    return usageAtErrorThreshold(resource) || usageAtWarningThreshold(resource);
  }, false);
}

export function explanationReasonText(resources) {
  if (!shouldRecommendPlan(resources)) {
    return '';
  }

  const resourcesDetails = RECOMMENDATION_RESOURCE_TYPES.reduce(
    (details, type) => {
      const resource = resources.find((r) => r.sys.id === type);

      if (!resource) {
        return details;
      }

      if (usageAtErrorThreshold(resource)) {
        details.reached.push(resourceHumanNameMap[type]);
      } else if (usageAtWarningThreshold(resource)) {
        details.near.push(resourceHumanNameMap[type]);
      }

      return details;
    },
    { near: [], reached: [] }
  );

  const numTotalDetails = resourcesDetails.reached.length + resourcesDetails.near.length;

  let resultText = '';

  if (resourcesDetails.reached.length > 0) {
    resultText += `you’ve reached the ${joinWithAnd(resourcesDetails.reached).toLowerCase()}`;
  }

  if (resourcesDetails.near.length > 0) {
    if (resourcesDetails.reached.length > 0) {
      resultText += ' and are ';
    } else {
      resultText += 'you’re ';
    }

    resultText += `near the ${joinWithAnd(resourcesDetails.near).toLowerCase()}`;
  }

  resultText += ` limit${numTotalDetails > 1 ? 's' : ''} for your current space plan`;

  return resultText;
}

function generatePlanRecommendationResources(plan, resources) {
  return RECOMMENDATION_RESOURCE_TYPES.map((type) => {
    const planIncludedResource = plan.includedResources.find((r) => {
      return resourceHumanNameMap[type].toLowerCase() === r.type.toLowerCase();
    });
    const resource = resources.find((r) => r.sys.id === type);

    if (!planIncludedResource || !resource) {
      // If we don't have either a plan resource or a current space resource
      // just return a generated resource that will not be at its limit.
      return {
        usage: 0,
        limits: {
          maximum: Infinity,
        },
        sys: {
          id: type,
        },
      };
    }

    return {
      usage: resource.usage,
      limits: {
        maximum: planIncludedResource.number,
      },
      sys: {
        id: type,
      },
    };
  });
}

/*
  Returns the plan that would fulfill your resource usage, given a set of space rate plans and
  the current space resources (usage/limits).
 */
export function getRecommendedPlan(spaceRatePlans = [], resources) {
  if (!shouldRecommendPlan(resources)) {
    return null;
  }

  // Valid plans are only ones that have no unavailablilty reasons
  const validPlans = spaceRatePlans.filter((plan) => !get(plan, 'unavailabilityReasons'));

  if (!resources || validPlans.length === 0) {
    return null;
  }

  const recommendedPlan = validPlans.find((plan) => {
    const planResources = generatePlanRecommendationResources(plan, resources);

    // Ensure that there are no generated "resources" for this plan that would be at
    // the error threshold right now
    return !planResources.find((resource) => usageAtErrorThreshold(resource));
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
