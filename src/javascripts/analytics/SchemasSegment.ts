type Schema = {
  name: string;
  version: string;
};

const schemas: Record<string, Schema> = {};

registerSchema({ name: 'feature_reference_action', version: '3' });

function registerSchema(schema: Schema) {
  schemas[schema.name] = schema;
}

export function getSegmentSchema(schema: string) {
  return schemas[schema];
}
