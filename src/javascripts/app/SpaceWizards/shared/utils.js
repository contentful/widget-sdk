import { get } from 'lodash';

import pluralize from 'pluralize';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { createApiKeyRepo } from 'features/api-keys-management';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import * as TokenStore from 'services/TokenStore';
import * as Analytics from 'analytics/Analytics';
import { getCreator as getTemplateCreator } from 'services/SpaceTemplateCreator';
import { getTemplate } from 'services/SpaceTemplateLoader';
import { go } from 'states/Navigator';
import { getModule } from 'core/NgRegistry';
import { canCreate } from 'utils/ResourceUtils';
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

async function makeNewSpace(name, plan, organizationId, sessionId) {
  const spaceData = {
    defaultLocale: 'en-US',
    name,
    productRatePlanId: get(plan, 'sys.id'),
  };

  const client = getCMAClient();

  const newSpace = await client.space.create(
    {
      organizationId,
    },
    spaceData
  );

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
