import { uniq } from 'lodash';
import * as JobsService from '../DataManagement/ScheduledActionsService';
import { getVariation, FLAGS } from 'LaunchDarkly';
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

export async function getJobsData(spaceEndpoint, query) {
  const releasesFlagEnabled = await getVariation(FLAGS.ADD_TO_RELEASE);
  const jobsCollection = await JobsService.getJobs(spaceEndpoint, query);

  const jobs = jobsCollection.items;

  if (jobs.length === 0) {
    return {
      jobs,
      entries: [],
      users: [],
      assets: [],
      releases: [],
    };
  }

  const filteredScheduledActions = releasesFlagEnabled
    ? jobs
    : jobs.filter((j) => defaultEntityTypes.includes(j.entity.sys.linkType));

  const idsByEntityType = filteredScheduledActions.reduce(
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

  const userIds = jobs.map((j) => j.sys.createdBy.sys.id);

  const [
    entriesCollection,
    assetCollection,
    releasesCollection,
    usersCollection,
  ] = await Promise.all([
    getEntities('Entry', idsByEntityType.Entry),
    getEntities('Asset', idsByEntityType.Asset),
    releasesFlagEnabled ? getEntities('Release', idsByEntityType.Release) : Promise.resolve([]),
    getUsers(spaceEndpoint, userIds),
  ]);

  return {
    jobs,
    entries: entriesCollection,
    assets: assetCollection,
    releases: releasesCollection.items,
    users: usersCollection.items,
    nextQuery: jobsCollection.pages.next,
  };
}
