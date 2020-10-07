import { useEffect } from 'react';
import { EVENTS } from '../utils/analyticsTracking';

import { getModule } from 'core/NgRegistry';

const maybeTrackCancelEvent = (trackWithSession, currentStep, finalStep) => {
  // When they've reached the final step they've already confirmed so we don't want to log a cancel event
  if (currentStep !== finalStep) {
    trackWithSession(EVENTS.CANCEL, { currentStep });
  }
};

function useTrackCancelEvent(trackWithSession, { currentStep, finalStep }) {
  useEffect(() => {
    const handleBeforeUnload = () => {
      maybeTrackCancelEvent(trackWithSession, currentStep, finalStep);
    };

    const $rootScope = getModule('$rootScope');

    // Angular $on functions return a callback that is the event listener
    // remover, rather than $rootScope.$off.
    const offStateChangeStart = $rootScope.$on('$stateChangeStart', handleBeforeUnload);

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      offStateChangeStart && offStateChangeStart();
    };
  }, [trackWithSession, currentStep, finalStep]);
}
export { useTrackCancelEvent };
