import AJV from 'ajv';
import schema from './config-schema';

export function validate (data) {
  const ajv = new AJV();
  if (!ajv.validate(schema, data)) {
    throw new ValidationError(ajv.errors);
  }
}

export class ValidationError extends Error {
  constructor (errors) {
    super('\n' + JSON.stringify(errors, null, 2));
    Error.captureStackTrace(this, ValidationError);
    this.errors = errors;
  }
}
