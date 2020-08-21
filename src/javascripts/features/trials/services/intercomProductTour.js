import * as Config from 'Config';
import * as Intercom from 'services/intercom';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const INTERCOM_PRODUCT_TOUR_ID = Config.env === 'production' ? 144319 : 144734;
const store = getBrowserStorage();
export const trialStore = store.forKey('platform_trial_tour_played');

export function initTrialProductTour() {
  const trialTourPlayed = trialStore.get();
  if (!trialTourPlayed) {
    trialStore.set(true);
    Intercom.startTour(INTERCOM_PRODUCT_TOUR_ID);
  }
}
