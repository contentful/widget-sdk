import ttiPolyfill from 'tti-polyfill';

const APPLICATION_PERFORMANCE_TTI = 'perf-time-to-interactive';

export async function track(Telemetry) {
  try {
    const ttiMs = await ttiPolyfill.getFirstConsistentlyInteractive();

    Telemetry.record(APPLICATION_PERFORMANCE_TTI, ttiMs);
  } catch (error) {
    // An error may occur if the browser does not support the metric.
  }
}
