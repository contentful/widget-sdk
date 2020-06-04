import { getModule } from 'core/NgRegistry';
import { go } from 'states/Navigator';
import * as EntityResolver from 'data/CMA/EntityResolver';

const releaseDetailNavigation = (release) => {
  const spaceContext = getModule('spaceContext');
  const path = ['spaces', 'detail', 'releases', 'detail'];

  if (!spaceContext.isMasterEnvironment()) {
    path.splice(2, 0, 'environment');
  }

  go({
    path,
    params: { releaseId: release.sys.id },
  });
};

const getEntities = async (release) => {
  const {
    entities: { items },
  } = release;
  const entryIds = items
    .filter(({ sys: { linkType } }) => linkType === 'Entry')
    .map(({ sys: { id } }) => id);

  const assetIds = items
    .filter(({ sys: { linkType } }) => linkType === 'Asset')
    .map(({ sys: { id } }) => id);

  const fetchedEntities = await Promise.all([
    EntityResolver.fetchForType('Entry', entryIds),
    EntityResolver.fetchForType('Asset', assetIds),
  ]);

  return fetchedEntities;
};

const similarDisplayFields = [
  {
    id: 'name',
    name: 'Name',
    colWidth: '20%',
  },
  {
    id: 'added',
    name: 'Added',
  },
  {
    id: 'updated',
    name: 'Updated',
  },
  {
    id: 'status',
    name: 'Status',
  },
];

const [firstObj, ...rest] = similarDisplayFields;

const displayedFields = {
  entries: [
    firstObj,
    {
      id: 'contentType',
      name: 'Content Type',
    },
    ...rest,
  ],
  assets: [
    {
      id: 'preview',
      name: 'Preview',
      colWidth: '8%',
    },
    ...similarDisplayFields,
  ],
};

export { releaseDetailNavigation, getEntities, displayedFields };
