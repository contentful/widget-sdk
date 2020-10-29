import * as Config from 'Config';
import * as Intercom from 'services/intercom';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { isSpaceOnTrial, isOrganizationOnTrial } from './TrialService';

const isProduction = Config.env === 'production';
export const INTERCOM_PLATFORM_TRIAL_TOUR_ID = isProduction ? 144319 : 144734;
export const INTERCOM_TRIAL_SPACE_TOUR_ID = isProduction ? 150291 : 150294;
const TRIAL_STORE_KEY = 'trial_tour_played';
const store = getBrowserStorage('local');

export function initTrialProductTour(space, org) {
  // space and/or org can be undefined
  if (!space && !org) {
    return;
  }

  if (space && org) {
    // if the space trial and enterprise trial co-exist
    if (isSpaceOnTrial(space) && isOrganizationOnTrial(org)) {
      return;
    }
  }

  const spaceId = space?.sys.id;
  const orgId = org?.sys.id;

  const trialStore = store.get(TRIAL_STORE_KEY);
  const storeOrgIds = trialStore?.orgIds || [];
  const storeSpaceIds = trialStore?.spaceIds || [];

  const orgIdExists = storeOrgIds.includes(orgId);
  const spaceIdExists = storeSpaceIds.includes(spaceId);

  if (isOrganizationOnTrial(org) && !orgIdExists) {
    Intercom.startTour(INTERCOM_PLATFORM_TRIAL_TOUR_ID);
    storeOrgIds.push(orgId);
  }

  if (isSpaceOnTrial(space) && !spaceIdExists) {
    Intercom.startTour(INTERCOM_TRIAL_SPACE_TOUR_ID);
    storeSpaceIds.push(spaceId);
  }

  // TODO: Set key on the modal close hook
  store.set(TRIAL_STORE_KEY, {
    orgIds: storeOrgIds,
    spaceIds: storeSpaceIds,
  });
}
