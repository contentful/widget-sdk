import fetchUnpublishedReferences from './FetchUnpublishedReferences';
import { getRichTextEntityLinks } from '@contentful/rich-text-links';
import { fetchEntities } from './EntityService';

jest.mock('@contentful/rich-text-links');
jest.mock('./EntityService');

const SPACE_ID = 'space-id';
const ENVIRONMENT_ID = 'environment-id';

describe('FetchUnpublishedReferences', () => {
  it('returns unpublished refs from rich text document', async () => {
    const entryRef = createEntity('Entry');
    const publishedEntryRef = publishEntity(createEntity('Entry'));

    const assetRef = createEntity('Asset');
    const publishedAssetRef = publishEntity(createEntity('Asset'));

    const richTextField = createContentTypeField({ type: 'RichText' });
    const contentType = createContentType({
      fields: [richTextField],
    });

    const entry = createTestEntry(contentType);

    const RT_DOC = {};
    entry.fields = {
      [richTextField.id]: {
        'en-GB': RT_DOC,
      },
    };

    getRichTextEntityLinks.mockReturnValueOnce({
      Entry: [getSys(getLink(entryRef)), getSys(getLink(publishedEntryRef))],
      Asset: [getSys(getLink(assetRef)), getSys(getLink(publishedAssetRef))],
    });

    fetchEntities.mockResolvedValueOnce([
      [entryRef, publishedEntryRef],
      [assetRef, publishedAssetRef],
    ]);

    const result = await fetchUnpublishedReferences({
      entry: entry,
      contentTypes: [contentType],
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
    });

    expect(getRichTextEntityLinks).toHaveBeenCalledTimes(1);
    expect(getRichTextEntityLinks).toHaveBeenCalledWith(RT_DOC);

    expect(fetchEntities).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
      entryIds: [getId(entryRef), getId(publishedEntryRef)],
      assetIds: [getId(assetRef), getId(publishedAssetRef)],
    });

    expect(result).toEqual([
      {
        field: {
          name: richTextField.name,
          internalLocaleCode: 'en-GB',
        },
        references: [entryRef, assetRef],
      },
    ]);
  });

  it('returns unpublished refs from link field', async () => {
    const entryRef = createEntity('Entry');
    const publishedEntryRef = publishEntity(createEntity('Entry'));

    const assetRef = createEntity('Asset');
    const publishedAssetRef = publishEntity(createEntity('Asset'));

    const linkField1 = createContentTypeField({ type: 'Link' });
    const linkField2 = createContentTypeField({ type: 'Link' });
    const linkField3 = createContentTypeField({ type: 'Link' });
    const linkField4 = createContentTypeField({ type: 'Link' });
    const contentType = createContentType({
      fields: [linkField1, linkField2, linkField3, linkField4],
    });

    const entry = createTestEntry(contentType);

    entry.fields = {
      [linkField1.id]: {
        'en-GB': getLink(entryRef),
      },
      [linkField2.id]: {
        'en-GB': getLink(publishedEntryRef),
      },
      [linkField3.id]: {
        'en-GB': getLink(assetRef),
      },
      [linkField4.id]: {
        'en-GB': getLink(publishedAssetRef),
      },
    };

    fetchEntities.mockResolvedValueOnce([
      [entryRef, publishedEntryRef],
      [assetRef, publishedAssetRef],
    ]);

    const result = await fetchUnpublishedReferences({
      entry: entry,
      contentTypes: [contentType],
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
    });

    expect(fetchEntities).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
      entryIds: [getId(entryRef), getId(publishedEntryRef)],
      assetIds: [getId(assetRef), getId(publishedAssetRef)],
    });

    expect(result).toEqual([
      {
        field: {
          name: linkField1.name,
          internalLocaleCode: 'en-GB',
        },
        references: [entryRef],
      },
      {
        field: {
          name: linkField3.name,
          internalLocaleCode: 'en-GB',
        },
        references: [assetRef],
      },
    ]);
  });

  it('returns unpublished refs from array field', async () => {
    const entryRef = createEntity('Entry');
    const publishedEntryRef = publishEntity(createEntity('Entry'));

    const assetRef = createEntity('Asset');
    const publishedAssetRef = publishEntity(createEntity('Asset'));

    const entryArrayField = createContentTypeField({ type: 'Array', items: { type: 'Link' } });
    const assetArrayField = createContentTypeField({ type: 'Array', items: { type: 'Link' } });

    const contentType = createContentType({
      fields: [entryArrayField, assetArrayField],
    });

    const entry = createTestEntry(contentType);

    entry.fields = {
      [entryArrayField.id]: {
        'en-GB': [getLink(entryRef), getLink(publishedEntryRef)],
      },
      [assetArrayField.id]: {
        'en-GB': [getLink(assetRef), getLink(publishedAssetRef)],
      },
    };

    fetchEntities.mockResolvedValueOnce([
      [entryRef, publishedEntryRef],
      [assetRef, publishedAssetRef],
    ]);

    const result = await fetchUnpublishedReferences({
      entry: entry,
      contentTypes: [contentType],
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
    });

    expect(fetchEntities).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
      entryIds: [getId(entryRef), getId(publishedEntryRef)],
      assetIds: [getId(assetRef), getId(publishedAssetRef)],
    });

    expect(result).toEqual([
      {
        field: {
          name: entryArrayField.name,
          internalLocaleCode: 'en-GB',
        },
        references: [entryRef],
      },
      {
        field: {
          name: assetArrayField.name,
          internalLocaleCode: 'en-GB',
        },
        references: [assetRef],
      },
    ]);
  });
});

function createEntity(type) {
  return {
    sys: {
      id: Math.random().toString(36),
      type,
    },
  };
}

function publishEntity(entity) {
  return { ...entity, sys: { ...entity.sys, publishedVersion: 1 } };
}

function getSys(entity) {
  return entity.sys;
}

function getLink(entity) {
  return { sys: { id: entity.sys.id, type: 'Link', linkType: entity.sys.type } };
}

function getId(entity) {
  return entity.sys.id;
}

function createContentType({ fields }) {
  const contentType = createEntity('ContentType');

  return {
    ...contentType,
    fields,
  };
}

function createTestEntry(contentType) {
  const entry = createEntity('Entry');
  return {
    ...entry,
    sys: {
      ...entry.sys,
      contentType: getLink(contentType),
    },
    fields: {},
  };
}

function createContentTypeField({ type, items }) {
  const field = {
    id: Math.random().toString(36),
    name: Math.random().toString(36),
    type,
  };

  if (type === 'Array') {
    field.items = items;
  }

  return field;
}
