import { uniq } from 'lodash';
import * as ScheduledActionsService from '../DataManagement/ScheduledActionsService';
import _ from 'lodash';
import * as EntityResolver from 'data/CMA/EntityResolver';
import { getReleases } from 'app/Releases/releasesService';

const defaultEntityTypes = ['Entry', 'Asset'];

function getUsers(endpoint, ids) {
  return endpoint({
    method: 'GET',
    path: ['users'],
    query: {
      'sys.id[in]': uniq(ids).join(','),
      limit: 1000,
    },
  });
}

function getEntities(entityType, ids) {
  if (!Array.isArray(ids) || !ids.length) {
    return Promise.resolve([]);
  }

  if (defaultEntityTypes.includes(entityType)) {
    return EntityResolver.fetchForType(entityType, ids);
  }

  return getReleases({
    'sys.id[in]': ids.join(','),
  });
}

export async function getJobsData({ environmentId }, spaceEndpoint, query) {
  const envScopedQuery = { ...query, 'environment.sys.id': environmentId };
  const jobsCollection = await ScheduledActionsService.getJobs(spaceEndpoint, envScopedQuery);

  const scheduledActions = jobsCollection.items;

  if (scheduledActions.length === 0) {
    return {
      jobs: scheduledActions,
      entries: [],
      users: [],
      assets: [],
      releases: [],
    };
  }

  const idsByEntityType = scheduledActions.reduce(
    (acc, scheduledAction) => {
      const entityType = scheduledAction.entity.sys.linkType;
      const entityId = scheduledAction.entity.sys.id;
      return {
        ...acc,
        [entityType]: [...acc[entityType], entityId],
      };
    },
    {
      Entry: [],
      Asset: [],
      Release: [],
    }
  );

  const userIds = scheduledActions.map((j) => j.sys.createdBy.sys.id);

  const [
    entriesCollection,
    assetCollection,
    releasesCollection,
    usersCollection,
  ] = await Promise.all([
    getEntities('Entry', idsByEntityType.Entry),
    getEntities('Asset', idsByEntityType.Asset),
    getEntities('Release', idsByEntityType.Release),
    getUsers(spaceEndpoint, userIds),
  ]);

  return {
    jobs: scheduledActions,
    entries: entriesCollection,
    assets: assetCollection,
    releases: releasesCollection.items,
    users: usersCollection.items,
    nextQuery: jobsCollection.pages.next,
  };
}
