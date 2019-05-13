import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import * as JobsService from './JobsService.es6';

const JobsFetcher = createFetcherComponent(async props => {
  const jobCollection = await JobsService.getJobsWithEntryId(props.endpoint, props.entryId);

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
