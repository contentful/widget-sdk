import { getModule } from 'core/NgRegistry';
import { go } from 'states/Navigator';
import * as EntityResolver from 'data/CMA/EntityResolver';
import { getReleaseAction } from '../releasesService';

const MAX_POLL_COUNT = 60;
const MAX_POLL_INTERVAL = 1000;
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

const waitForReleaseAction = async (releaseId, id, tries = 1) => {
  const response = await getReleaseAction(releaseId, id);

  if (tries === MAX_POLL_COUNT) {
    return Promise.reject();
  }

  switch (response.sys.status) {
    case 'succeeded':
      return response;
    case 'failed':
      return Promise.reject(response);
    default: {
      await new Promise((resolve) => setTimeout(resolve, MAX_POLL_INTERVAL));
      return waitForReleaseAction(releaseId, id, tries + 1);
    }
  }
};

const findValidationErrorForEntity = (entityId, validationErrors) => {
  if (!validationErrors) {
    return null;
  }

  const errored = validationErrors.find(({ sys: { id } }) => entityId === id);
  return errored ? errored.error.message : null;
};

const pluralize = (amount, word) => {
  const plural = {
    has: 'have',
    entry: 'entries',
    asset: 'assets',
    entity: 'entities',
  };

  if (amount > 1) {
    const result = !word.includes(' ')
      ? plural[word]
      : word
          .split(' ')
          .map((el) => plural[el])
          .join(' ');

    return result;
  }

  return word;
};

const erroredEntityType = (entityType, validationErrors) =>
  validationErrors.filter(({ sys: { linkType } }) => linkType === entityType);

const switchToErroredTab = (validationErrors, currentTab) => {
  const erroredTab = [...new Set(validationErrors.map(({ sys: { linkType } }) => linkType))];

  return erroredTab.length === 1 ? pluralize(2, erroredTab[0].toLowerCase()) : currentTab;
};

export {
  releaseDetailNavigation,
  getEntities,
  displayedFields,
  waitForReleaseAction,
  findValidationErrorForEntity,
  pluralize,
  erroredEntityType,
  switchToErroredTab,
};
