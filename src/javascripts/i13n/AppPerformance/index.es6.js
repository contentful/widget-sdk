import { once } from 'lodash';
import * as Analytics from 'analytics/Analytics.es6';
import * as Telemetry from '../Telemetry.es6';

import * as Tti from './Tti.es6';
import * as NavigationTiming from './NavigationTiming.es6';
import * as PaintTiming from './PaintTiming.es6';

/**
 * Aggregates and records application performance metrics
 * e.g. paint timing, time to interactive
 *
 * @export
 * @param {String} { stateName }
 */
export const track = once(({ stateName }) => {
  try {
    const TelemetryWithStateName = {
      record: (name, value) => {
        Telemetry.record(name, value, {
          stateName: stateName
        });

        // TODO: use proper keys after switching
        // to analytics
        const analyticsName = name
          .split('-')
          .slice(1)
          .join('_');
        Analytics.track(`perf:${analyticsName}`, { value });
      }
    };

    NavigationTiming.track(TelemetryWithStateName);
    PaintTiming.track(TelemetryWithStateName);
    Tti.track(TelemetryWithStateName);
  } catch (error) {
    // Although this should never happen
    // because individual metrics are wrapped with try/catch,
    // no error in the instrumentation should break the app.
  }
});
