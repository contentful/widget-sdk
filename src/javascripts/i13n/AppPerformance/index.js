import { once } from 'lodash';
import * as Analytics from 'analytics/Analytics';
import * as Telemetry from '../Telemetry';

import * as Tti from './Tti';
import * as NavigationTiming from './NavigationTiming';
import * as PaintTiming from './PaintTiming';

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
        Analytics.track(`perf:${analyticsName}`, { value, stateName: stateName });
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
