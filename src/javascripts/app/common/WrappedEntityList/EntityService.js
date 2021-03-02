import { getModule } from 'core/NgRegistry';
import { entityHelpers } from '@contentful/field-editor-shared';
import TheLocaleStore from 'services/localeStore';
import * as PublicContentType from 'widgets/PublicContentType';
import { getCMAClient } from 'core/services/usePlainCMAClient';

function getContentTypeById(contentTypeId) {
  const spaceContext = getModule('spaceContext');
  const internalContentType = spaceContext.publishedCTs
    .getAllBare()
    .find((ct) => ct.sys.id === contentTypeId);
  return internalContentType ? PublicContentType.fromInternal(internalContentType) : undefined;
}

export async function getEntityData(entity) {
  const spaceContext = getModule('spaceContext');

  const cma = getCMAClient({
    spaceId: spaceContext.getId(),
    environmentId: spaceContext.getEnvironmentId(),
  });

  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
  const status = entityHelpers.getEntryStatus(entity.sys);

  let title = '';
  let description = '';
  let file;

  if (entity.sys.type === 'Entry') {
    const contentType = getContentTypeById(entity.sys.contentType.sys.id);
    title = entityHelpers.getEntryTitle({
      entry: entity,
      contentType,
      localeCode: defaultLocaleCode,
      defaultLocaleCode,
      defaultTitle: 'Untitled',
    });
    description = entityHelpers.getEntityDescription({
      entity,
      localeCode: defaultLocaleCode,
      defaultLocaleCode,
      contentType,
    });
    try {
      file = await entityHelpers.getEntryImage(
        { entry: entity, contentType, localeCode: defaultLocaleCode, defaultLocaleCode },
        (assetId) => {
          return cma.asset.get({ assetId });
        }
      );
    } catch (e) {
      file = null;
    }
  } else {
    title = entityHelpers.getAssetTitle({
      asset: entity,
      localeCode: defaultLocaleCode,
      defaultLocaleCode: defaultLocaleCode,
      defaultTitle: 'Untitled',
    });
    file = entityHelpers.getFieldValue({
      entity,
      fieldId: 'file',
      localeCode: defaultLocaleCode,
      defaultLocaleCode,
    });
  }

  return {
    title,
    description,
    status,
    file,
  };
}
