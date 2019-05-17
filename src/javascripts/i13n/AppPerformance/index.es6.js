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
export function track({ stateName }) {
  try {
    const TelemetryWithStateName = {
      ...Telemetry,
      record: (name, value) =>
        Telemetry.record(name, value, {
          stateName: stateName
        })
    };

    NavigationTiming.track(TelemetryWithStateName);
    PaintTiming.track(TelemetryWithStateName);
    Tti.track(TelemetryWithStateName);
  } catch (error) {
    // overprotective try-catch
  }
}
