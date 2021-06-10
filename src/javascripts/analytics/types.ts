declare global {
  interface Window {
    // analytics is initialized in src/javascript/analytics/generated/segment.ts
    // analytics: any;
    GlobalSnowplowNamespace: Array<string>;
  }
}

export type SegmentSchema = {
  name: string;
  isLegacySnowplowGeneric?: boolean;
};

export type SnowplowSchema = {
  name: string;
  version: string;
  path: string;
};

/**
 * Raw analytics event data as accepted by Analytics.track()
 * This is not the data that will be sent to Snowplow or Segment as it's not "transformed".
 */
export type EventData = Record<string, unknown>;

/**
 * `EventData` transformed by the Analytics service which can be passed to segment or snowplow
 * services for further processing into the final service specific payload.
 */
export type TransformedEventData = {
  schema?: string;
  data: Record<string, unknown>;
  contexts?: Record<string, unknown>[];
};

export type TransformedSegmentEventData = {
  payload: Record<string, unknown>;
};
