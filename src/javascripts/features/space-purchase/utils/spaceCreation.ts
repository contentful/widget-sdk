import type { Asset, Entry, ContentType } from '@contentful/types';
import type { SpaceData } from 'classes/spaceContextTypes';
import type { SelectedTemplate } from '../context/types';

import { getCMAClient } from 'core/services/usePlainCMAClient';
import * as TokenStore from 'services/TokenStore';
import { getCreator as getTemplateCreator } from 'services/SpaceTemplateCreator';
import { getTemplate } from 'services/SpaceTemplateLoader';
import { getSpaceContext } from 'classes/spaceContext';

interface ApiKey {
  description: string;
  name: string;
}

interface Locale {
  code: string;
  default: boolean;
  fallbackCode?: string;
  name: string;
}

interface TemplateData {
  apiKeys: ApiKey[];
  assets: Asset[];
  contentTypes: ContentType[];
  entries: Entry[];
  space: {
    locales: Locale[];
    name: string;
    sys: {
      id: string;
      type: 'Space';
    };
  };
}

interface TemplateCreator {
  create: (templateData: TemplateData) => { spaceSetup: Promise<unknown>; contentCreated: unknown };
}

export async function makeNewSpace(
  organizationId: string,
  productRatePlanId: string,
  spaceName: string
): Promise<SpaceData> {
  const spaceData = {
    defaultLocale: 'en-US',
    name: spaceName,
    productRatePlanId,
  };

  const client = getCMAClient();
  const newSpace: SpaceData = await client.space.create({ organizationId }, spaceData);

  await TokenStore.refresh();

  return newSpace;
}

export async function applyTemplateToSpace(
  newSpace: SpaceData,
  selectedTemplate: SelectedTemplate
): Promise<void> {
  const spaceContext = getSpaceContext();
  // Need to set the correct space on the spaceContext
  await TokenStore.getSpace(newSpace.sys.id).then((space) => spaceContext.resetWithSpace(space));

  const templateCreator: TemplateCreator = getTemplateCreator(
    spaceContext,
    { onItemSuccess: () => null, onItemError: () => null },
    selectedTemplate,
    'en-US'
  );

  const templateData = await getTemplate(selectedTemplate);

  await tryCreateTemplate(templateCreator, templateData);

  await spaceContext.publishedCTs.refresh();
}

async function tryCreateTemplate(
  templateCreator: TemplateCreator,
  templateData: TemplateData,
  retried?: boolean
): Promise<void> {
  const { spaceSetup, contentCreated } = templateCreator.create(templateData);

  try {
    await Promise.all([
      // we suppress errors, since `contentCreated` will handle them
      spaceSetup.catch(() => null),
      contentCreated,
    ]);
  } catch (err) {
    if (!retried) {
      return tryCreateTemplate(templateCreator, err.template, true);
    }

    throw err;
  }
}
