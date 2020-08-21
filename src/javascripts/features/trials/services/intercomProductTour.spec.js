import * as Intercom from 'services/intercom';
import { initTrialProductTour } from './intercomProductTour';
import { getBrowserStorage } from 'core/services/BrowserStorage';

jest.mock('services/intercom', () => ({
  startTour: jest.fn(),
}));

describe('Trial/IntercomProductTour', () => {
  beforeEach(() => {
    initTrialProductTour();
  });

  it('should start the intercom product tour', () => {
    expect(Intercom.startTour).toHaveBeenCalledTimes(1);
  });

  it('should not start intercom product tour if already key exists in localStorage', () => {
    getBrowserStorage().set('platform_trial_tour_played', true);
    expect(Intercom.startTour).toHaveBeenCalledTimes(0);
  });
});
