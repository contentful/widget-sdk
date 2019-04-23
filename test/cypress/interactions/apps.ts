import * as state from '../util/interactionState';
import { getApps } from '../util/requests';

export function noInstalledAppsResponse() {
  return cy
    .addInteraction({
      state: state.Apps.NONE_INSTALLED,
      uponReceiving: 'a request for all installed Apps',
      withRequest: getApps(),
      willRespondWith: {
        status: 200,
        body: {}
      }
    })
    .as(state.Apps.NONE_INSTALLED);
}
