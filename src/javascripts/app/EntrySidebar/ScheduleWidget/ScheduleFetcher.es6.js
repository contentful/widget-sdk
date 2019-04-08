import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import * as ScheduleService from './ScheduleService.es6';

const ScheduleFetcher = createFetcherComponent(async props => {
  const scheduleCollection = await ScheduleService.getSchedulesWithEntryId(props.entryId);

  return {
    scheduleCollection
  };
});

/**
 * Component fetches schedules with given entry-id.
 *
 * @class ScheduleFetcher
 * @extends {Component}
 */
export default ScheduleFetcher;
