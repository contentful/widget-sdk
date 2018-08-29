const AJV = require('ajv');
const schema = require('./config-schema');

class ValidationError extends Error {
  constructor(errors) {
    super('\n' + JSON.stringify(errors, null, 2));
    Error.captureStackTrace(this, ValidationError);
    this.errors = errors;
  }
}

module.exports.validate = function validate(data) {
  const ajv = new AJV();
  if (!ajv.validate(schema, data)) {
    throw new ValidationError(ajv.errors);
  }
};

module.exports.ValidationError = ValidationError;
