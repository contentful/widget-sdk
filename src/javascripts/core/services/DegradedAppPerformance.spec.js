import * as DegradedAppPerformance from './DegradedAppPerformance';
import { ModalLauncher } from 'core/components/ModalLauncher';

describe('DegradedAppPerformance', () => {
  beforeEach(() => {
    DegradedAppPerformance.init();
  });

  describe('#trigger', () => {
    it('should show a modal when triggered', () => {
      DegradedAppPerformance.trigger();
      expect(ModalLauncher.open).toBeCalled();
    });

    it('should only show the modal once, even if triggered multiple times', () => {
      DegradedAppPerformance.trigger();

      expect(ModalLauncher.open).toHaveBeenCalledTimes(1);

      DegradedAppPerformance.trigger();

      expect(ModalLauncher.open).toHaveBeenCalledTimes(1);
    });
  });
});
