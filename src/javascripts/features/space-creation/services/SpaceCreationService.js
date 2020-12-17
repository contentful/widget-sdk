import { get } from 'lodash';
import client from 'services/client';
import * as TokenStore from 'services/TokenStore';
import { createTemplate } from 'features/space-purchase';
import { Notification } from '@contentful/forma-36-react-components';

export async function makeNewSpace(orgId, selectedPlan, spaceName) {
  const spaceData = {
    defaultLocale: 'en-US',
    name: spaceName,
    spacePlanId: get(selectedPlan, 'sys.id'),
  };

  const newSpace = await client.createSpace(spaceData, orgId);

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
    await createTemplate(newSpace, selectedTemplate);
  } catch (error) {
    Notification.error(
      'We had a problem creating your template.Something happened while creating the template.You can still use your space, but some content from the template may be missing.',
      { duration: 3000 }
    );
  }
  return newSpace;
}
