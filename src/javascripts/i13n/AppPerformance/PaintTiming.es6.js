const APPLICATION_FIRST_CONTENTFUL_PAINT = 'perf-first-contentful-paint';

export function track(Telemetry) {
  try {
    const [contentfulPaint] = performance.getEntriesByName('first-contentful-paint');

    Telemetry.record(APPLICATION_FIRST_CONTENTFUL_PAINT, contentfulPaint.startTime);
  } catch (error) {
    //ignore errors
  }
}
