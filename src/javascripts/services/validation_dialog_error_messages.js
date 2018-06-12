'use strict';

/**
 * Provide a function that returns a human readable error message for a
 * failed validation setup.
 *
 * The function expects two arguments: The type of the validation the
 * error occured on (e.g. 'size', 'range', etc.) and the error object
 * raised by the validation.
 *
 * The error messages are [specified on the wiki][wiki-validations].
 *
 * FIXME This is officially horrible since we inspect the original
 * error message (called 'details') to determine what is wrong. The
 * validation library that produces the errors needs to provide more
 * structured information to determine the type of the error.
 *
 * [wiki-validations]: https://contentful.atlassian.net/wiki/display/PROD/Validations
 */
angular.module('contentful')
.factory('validationDialogErrorMessages', () => {
  var sizeMessage = details => {
    if (details === 'Expected max >= min') {
      return 'Minimum value has to be smaller than maximum value';
    } else {
      return 'Please provide a positive integer';
    }
  };

  var messages = {
    'size': sizeMessage,

    'range': function (details) {
      if (details === 'Expected max >= min') {
        return 'Minimum value has to be smaller than maximum value';
      } else {
        return 'Please provide at least a one number';
      }
    },

    'regexp': function (details) {
      if (details === 'Invalid regular expression') {
        return 'Please provide a valid regular expression with valid flags';
      } else {
        return 'Please provide custom regular expression or select a predefined one';
      }
    },

    'dateRange': function () {
      return 'Please specify a date range by setting earliest date, latest date or both';
    },

    'linkMimetypeGroup': function () {
      return 'Please check at least one file type';
    },

   'linkContentType': function () {
     return 'Please check at least one content type';
   },

   'assetFileSize': sizeMessage,
   'assetImageDimensions': sizeMessage,
  };

  return function getErrorMessage (validationType, error) {
    if (validationType in messages)
      return messages[validationType](error.details);
    else
      return error.details;
  };
});
