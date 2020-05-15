const APPLICATION_FIRST_CONTENTFUL_PAINT = 'perf-first-contentful-paint';

export function track(Telemetry) {
  try {
    const [contentfulPaint] = window.performance.getEntriesByName('first-contentful-paint');

    Telemetry.record(APPLICATION_FIRST_CONTENTFUL_PAINT, contentfulPaint.startTime);
  } catch (error) {
    // An error may occur if the browser does not support the metric.
  }
}