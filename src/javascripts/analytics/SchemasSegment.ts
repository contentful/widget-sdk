export type Schema = {
  name: string;
  version: string;
  /**
   * Defines whether the payload sent to Segment should be wrapped in a redundant `{ data: payload }` which
   * results in table columns prefixed with `data_`. This is necessary for schemas that were auto generated
   * during the Snowplow -> Segment migration due to a bug.
   * With this flag we can keep supporting these malformed events while not making this an unwanted
   * convention for new events.
   *
   * @default false
   */
  wrapPayloadInData?: boolean;
};

const schemas: Record<string, Schema> = {};

registerSchema({ name: 'feature_reference_action', version: '3' });

/**
 * @deprecated Do not add events here, instead use `Analytics.tracking.…` which make use of Segment typewriter.
 */
function registerSchema(schema: Schema) {
  schemas[schema.name] = schema;
}

export function getSegmentSchema(schema: string) {
  return schemas[schema];
}
