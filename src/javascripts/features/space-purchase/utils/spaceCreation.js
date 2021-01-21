import { get } from 'lodash';

import client from 'services/client';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { createApiKeyRepo } from 'features/api-keys-management';
import * as TokenStore from 'services/TokenStore';
import { getCreator as getTemplateCreator } from 'services/SpaceTemplateCreator';
import { getTemplate } from 'services/SpaceTemplateLoader';
import { getModule } from 'core/NgRegistry';
import { getSpaceContext } from 'classes/spaceContext';
import * as Analytics from 'analytics/Analytics';

export async function makeNewSpace(organizationId, productRatePlan, spaceName) {
  const spaceData = {
    defaultLocale: 'en-US',
    name: spaceName,
    productRatePlanId: get(productRatePlan, 'sys.id'),
  };

  const newSpace = await client.createSpace(spaceData, organizationId);

  await TokenStore.refresh();

  return newSpace;
}

export async function createSpaceWithTemplate(
  organizationId,
  productRatePlan,
  spaceName,
  template
) {
  const $rootScope = getModule('$rootScope');

  const newSpace = await makeNewSpace(organizationId, productRatePlan, spaceName);
  const spaceContext = getSpaceContext();
  // Need to set the correct space on the spaceContext
  await TokenStore.getSpace(newSpace.sys.id).then((newSpace) =>
    spaceContext.resetWithSpace(newSpace)
  );

  Analytics.track('space:create', {
    templateName: template.name,
    entityAutomationScope: { scope: 'space_template' },
  });

  await makeTemplate(template, spaceContext);

  $rootScope.$broadcast('spaceTemplateCreated');
  return newSpace;
}

export async function createSpace(organizationId, productRatePlan, spaceName) {
  const newSpace = await makeNewSpace(organizationId, productRatePlan, spaceName);

  Analytics.track('space:create', { templateName: 'Blank' });

  const spaceEndpoint = createSpaceEndpoint(newSpace.sys.id);
  const apiKeyRepo = createApiKeyRepo(spaceEndpoint);

  await apiKeyRepo.create(
    'Example Key',
    'We’ve created an example API key for you to help you get started.'
  );

  return newSpace;
}

export async function createTemplate(newSpace, templateInfo) {
  const spaceContext = getSpaceContext();
  // Need to set the correct space on the spaceContext
  await TokenStore.getSpace(newSpace.sys.id).then((newSpace) =>
    spaceContext.resetWithSpace(newSpace)
  );

  await makeTemplate(templateInfo, spaceContext);
}

async function makeTemplate(templateInfo, spaceContext) {
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
