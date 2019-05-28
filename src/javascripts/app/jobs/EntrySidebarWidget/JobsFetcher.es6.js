import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import * as JobsService from '../DataManagement/JobsService.es6';

const JobsFetcher = createFetcherComponent(async props => {
  const jobCollection = await JobsService.getJobs(props.endpoint, {
    'sys.entity.sys.id': props.entryId,
    'sys.status': 'pending'
  });

  return {
    jobCollection
  };
});

/**
 * Component fetches jobs with given entry-id.
 *
 * @class JobsFetcher
 * @extends {Component}
 */
export default JobsFetcher;
