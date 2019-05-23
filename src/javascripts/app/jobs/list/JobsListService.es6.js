import { uniq } from 'lodash';
import * as JobsService from '../DataManagement/JobsService.es6';

function getEntriesWithIds(endpoint, ids) {
  return endpoint(
    {
      method: 'GET',
      path: ['entries'],
      query: {
        'sys.id[in]': uniq(ids).join(',')
      }
    },
    { 'X-Contentful-Skip-Transformation': true }
  );
}

function getUsers(endpoint, ids) {
  return endpoint({
    method: 'GET',
    path: ['users'],
    query: {
      'sys.id[in]': uniq(ids).join(',')
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
    getEntriesWithIds(spaceEndpoint, entryIds),
    getUsers(spaceEndpoint, userIds)
  ]);

  return {
    jobs,
    entries: entriesCollection.items,
    users: usersCollection.items
  };
}
