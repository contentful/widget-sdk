import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import { track } from 'analytics/Analytics';

export const safeNonBlockingTrack = (...args) => {
  const queueFn = window.requestIdleCallback || window.requestAnimationFrame || noop;
  queueFn(() => {
    try {
      track(...args);
    } catch (e) {
      // do nothing
    }
  });
};

export const EditorWithTrackingProps = {
  viewType: PropTypes.string.isRequired,
  sdk: PropTypes.object.isRequired,
  loadEvents: PropTypes.shape({
    emit: PropTypes.func.isRequired,
  }).isRequired,
};
