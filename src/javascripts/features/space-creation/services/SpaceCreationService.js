import { get } from 'lodash';
import * as TokenStore from 'services/TokenStore';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { applyTemplateToSpace } from 'features/space-purchase';
import { Notification } from '@contentful/forma-36-react-components';
import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';

export async function makeNewSpace(organizationId, selectedPlan, spaceName) {
  const spaceData = {
    defaultLocale: 'en-US',
    name: spaceName,
    ...(isFreeProductPlan(selectedPlan)
      ? { productRatePlanId: 'free' }
      : { spacePlanId: get(selectedPlan, 'sys.id') }),
  };

  const client = getCMAClient();

  const newSpace = await client.space.create(
    {
      organizationId,
    },
    spaceData
  );

  await TokenStore.refresh();

  return newSpace;
}

export async function spaceCreation(orgId, spaceName, selectedPlan) {
  const newSpace = await makeNewSpace(orgId, selectedPlan, spaceName);
  return newSpace;
}

export async function createSpaceWithTemplate({
  orgId,
  spaceName,
  selectedPlan,
  selectedTemplate,
}) {
  const newSpace = await makeNewSpace(orgId, selectedPlan, spaceName);
  try {
    await applyTemplateToSpace(newSpace, selectedTemplate);
  } catch (error) {
    Notification.error(
      'We had a problem creating your template. You can still use your space, but some content from the template may be missing.',
      { duration: 4000 }
    );
  }
  return newSpace;
}
