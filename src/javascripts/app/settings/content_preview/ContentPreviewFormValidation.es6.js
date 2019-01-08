import { values } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const contentPreview = getModule('contentPreview');

function getWarnings(config) {
  const warnings = [];
  function appendWarningIfPresent(fields, message) {
    if (fields.length) {
      warnings.push(message + fields.join(', '));
    }
  }
  const invalidFields = contentPreview.getInvalidFields(config.url, config.contentTypeFields);
  appendWarningIfPresent(
    invalidFields.nonExistentFields,
    "Fields with the following IDs don't exist in the content type: "
  );
  appendWarningIfPresent(
    invalidFields.invalidTypeFields,
    'Fields with the following IDs will be output as an object or array: '
  );
  return warnings;
}

function validateConfig(config) {
  if (config.enabled && !config.url) {
    return 'Please provide a URL.';
  } else if (config.url && !contentPreview.urlFormatIsValid(config.url)) {
    return 'URL is invalid';
  } else {
    const warnings = getWarnings(config);
    return warnings.join(' ');
  }
}

export default function validate(name, config) {
  const errors = [];

  if (!name) {
    errors.push({
      type: 'name',
      error: 'Please provide a name'
    });
  }

  values(config).forEach(item => {
    const error = validateConfig(item);
    if (error) {
      errors.push({
        type: 'contentType',
        contentType: item.contentType,
        error
      });
    }
  });

  return errors;
}
