import { uniq } from 'lodash';
import * as JobsService from '../DataManagement/JobsService.es6';
import _ from 'lodash';
import * as EntityResolver from 'data/CMA/EntityResolver.es6';
import { getModule } from 'NgRegistry.es6';

function getEntriesWithIds(ids) {
  const spaceContext = getModule('spaceContext');
  return EntityResolver.fetchForType(spaceContext, 'Entry', ids);
}

function getUsers(endpoint, ids) {
  return endpoint({
    method: 'GET',
    path: ['users'],
    query: {
      'sys.id[in]': uniq(ids).join(','),
      limit: 1000
    }
  });
}

export async function getJobsData(spaceEndpoint, query) {
  const jobsCollection = await JobsService.getJobs(spaceEndpoint, query);

  const jobs = jobsCollection.items;

  if (jobs.length === 0) {
    return {
      jobs,
      entries: [],
      users: []
    };
  }

  const entryIds = jobs
    .filter(j => j.sys.entity.sys.linkType === 'Entry')
    .map(j => j.sys.entity.sys.id);

  const userIds = jobs.map(j => j.sys.scheduledBy.sys.id);

  const [entriesCollection, usersCollection] = await Promise.all([
    getEntriesWithIds(entryIds),
    getUsers(spaceEndpoint, userIds)
  ]);

  return {
    jobs,
    entries: entriesCollection,
    users: usersCollection.items
  };
}
