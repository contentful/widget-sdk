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

export function trackWizardEvent(eventName, payload) {
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

async function createTemplate(templateInfo) {
  const spaceContext = getModule('spaceContext');

  const defaultLocale = 'en-US';

  const templateCreator = getTemplateCreator(
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
