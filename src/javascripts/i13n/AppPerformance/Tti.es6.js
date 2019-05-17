import ttiPolyfill from 'tti-polyfill';

const APPLICATION_PERFORMANCE_TTI = 'perf-time-to-interactive';

export async function track(Telemetry) {
  try {
    const tti = await ttiPolyfill.getFirstConsistentlyInteractive();

    Telemetry.record(APPLICATION_PERFORMANCE_TTI, tti);
  } catch (error) {
    // ignore errors
  }
}
