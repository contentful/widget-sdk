import * as Intercom from 'services/intercom';
import { trackTaskCreated, trackTaskResolved, trackIsTasksAlphaEligible } from './analytics';

describe('TasksWidget/analytics', () => {
  beforeEach(() => {
    jest.spyOn(Intercom, 'trackEvent').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('trackTaskCreated()', () => {
    trackTaskCreated();
    expect(Intercom.trackEvent).toHaveBeenCalledTimes(1);
    expect(Intercom.trackEvent).toHaveBeenCalledWith('feature-tasks-task-created');
    trackTaskCreated();
    expect(Intercom.trackEvent).toHaveBeenCalledTimes(2);
  });

  it('trackTaskResolved()', () => {
    trackTaskResolved();
    expect(Intercom.trackEvent).toHaveBeenCalledTimes(1);
    expect(Intercom.trackEvent).toHaveBeenCalledWith('feature-tasks-task-resolved');
    trackTaskResolved();
    expect(Intercom.trackEvent).toHaveBeenCalledTimes(2);
  });

  describe('trackTaskResolved()', () => {
    it('calls intercom only once after Intercom is enabled', () => {
      Intercom.isEnabled = () => false;
      trackIsTasksAlphaEligible();

      expect(Intercom.trackEvent).toHaveBeenCalledTimes(0);

      Intercom.isEnabled = () => true;
      trackIsTasksAlphaEligible();
      trackIsTasksAlphaEligible();

      expect(Intercom.trackEvent).toHaveBeenCalledTimes(1);
      expect(Intercom.trackEvent).toHaveBeenCalledWith('feature-tasks-is-alpha-eligible');
    });
  });
});
