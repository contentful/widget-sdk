import _ from 'lodash';

const messages = {
  size: function (error) {
    if (_.isString(error.value)) {
      return stringLengthMessage(error.min, error.max);
    } else {
      return sizeMessage(error.min, error.max, 'items');
    }
  },

  range: function (error) {
    if (_.isNumber(error.min) && _.isNumber(error.max)) {
      return 'Please enter a number between ' + error.min + ' and ' + error.max;
    } else if (_.isNumber(error.min)) {
      return 'Please enter a number no less than ' + error.min;
    } else {
      return 'Please enter a number no greater than ' + error.max;
    }
  },

  regexp: function () {
    return 'Input does not match the expected format. Please edit and try again.';
  },

  prohibitRegexp: function () {
    return 'Input does not match the expected format. Please edit and try again.';
  },

  in: function (error) {
    return 'Must be one of ' + error.expected.join(', ') + '.';
  },

  required: function (error) {
    if (error.path.length === 1 && error.path[0] === 'fields') {
      return 'All fields are empty. Please fill out some fields.';
    } else {
      return 'Required';
    }
  },

  unique: function (error) {
    if (error.conflicting.length > 1) {
      return 'There are already entries with the same ${fieldName} field';
    } else {
      return "There's already an entry with the same ${fieldName} field";
    }
  },
};

function stringLengthMessage(min, max) {
  if (_.isNumber(min) && _.isNumber(max)) {
    return "Please edit the text so it's between " + min + ' and ' + max + ' characters long';
  } else if (_.isNumber(min)) {
    return "Please expand the text so it's no shorter than " + min + ' characters';
  } else {
    return "Please shorten the text so it's no longer than " + max + ' characters';
  }
}

function sizeMessage(min, max, itemsName) {
  if (_.isNumber(min) && _.isNumber(max)) {
    return 'Please provide between ' + min + ' and ' + max + ' ' + itemsName;
  } else if (_.isNumber(min)) {
    return 'Please provide at least ' + min + ' ' + itemsName;
  } else {
    return 'Please provide at most ' + max + ' ' + itemsName;
  }
}

function defaultMessage(error) {
  if (error.message) {
    return error.message;
  }
  if (error.details) {
    return error.details;
  } else {
    return 'Error: ' + error.name;
  }
}

function buildErrorMessage(error) {
  const getMessage = messages[error.name] || defaultMessage;
  return getMessage(error);
}

buildErrorMessage.size = sizeMessage;
buildErrorMessage.stringLength = stringLengthMessage;

export default buildErrorMessage;
