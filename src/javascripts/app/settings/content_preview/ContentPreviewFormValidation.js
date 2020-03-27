import _ from 'lodash';
import {
  VALID_URL_PATTERN,
  ENTRY_FIELD_PATTERN,
} from 'services/contentPreview/createContentPreview';

function getWarnings(config) {
  const warnings = [];
  function appendWarningIfPresent(fields, message) {
    if (fields.length) {
      warnings.push(message + fields.join(', '));
    }
  }
  const invalidFields = getInvalidFields(config.url, config.contentTypeFields);
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
  } else if (config.url && !VALID_URL_PATTERN.test(config.url)) {
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
      error: 'Please provide a name',
    });
  }

  _.values(config).forEach((item) => {
    const error = validateConfig(item);
    if (error) {
      errors.push({
        type: 'contentType',
        contentType: item.contentType,
        error,
      });
    }
  });

  return errors;
}

function getInvalidFields(url, fields) {
  const tokens = extractFieldTokensFromUrl(url);

  const objectFields = _.map(
    _.filter(fields, (field) => _.includes(['Array', 'Link', 'Object', 'Location'], field.type)),
    'apiName'
  );

  const nonExistentFields = _.difference(tokens, _.map(fields, 'apiName'));
  const invalidTypeFields = _.intersection(tokens, objectFields);

  return { nonExistentFields, invalidTypeFields };
}

function extractFieldTokensFromUrl(url) {
  const tokens = [];
  let match;

  do {
    match = ENTRY_FIELD_PATTERN.exec(url);
    if (match) {
      tokens.push(match[1]);
    }
  } while (match);

  return _.uniq(tokens);
}
