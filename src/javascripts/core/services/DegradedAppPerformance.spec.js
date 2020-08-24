import * as DegradedAppPerformance from './DegradedAppPerformance';
import { ModalLauncher } from 'core/components/ModalLauncher';
import * as Telemetry from 'i13n/Telemetry';
import * as Analytics from 'analytics/Analytics';

describe('DegradedAppPerformance', () => {
  beforeEach(() => {
    DegradedAppPerformance.init();

    jest.spyOn(Telemetry, 'count').mockImplementation(() => {});
  });

  afterEach(() => {
    Telemetry.count.mockRestore();
  });

  describe('#trigger', () => {
    it('should show a modal when triggered', () => {
      DegradedAppPerformance.trigger('tests');
      expect(ModalLauncher.open).toBeCalled();
    });

    it('should track using Telemetry and Analytics.track', () => {
      DegradedAppPerformance.trigger('tests');

      expect(Telemetry.count).toHaveBeenCalledWith('degraded-app-performance-modal-shown', {
        reason: 'tests',
      });

      expect(Analytics.track).toHaveBeenCalledWith('degraded_app_performance:modal_shown', {
        reason: 'tests',
      });
    });

    it('should only show the modal once, even if triggered multiple times', () => {
      DegradedAppPerformance.trigger('tests');

      expect(ModalLauncher.open).toHaveBeenCalledTimes(1);

      DegradedAppPerformance.trigger('tests');

      expect(ModalLauncher.open).toHaveBeenCalledTimes(1);
    });
  });
});