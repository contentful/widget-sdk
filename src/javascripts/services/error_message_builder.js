'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name baseErrorMessageBuilder
   *
   * @method {function (error:Error): string} baseErrorMessageBuilder
   */
  .factory('baseErrorMessageBuilder', [
    () => {
      var messages = {
        size: function(error) {
          if (_.isString(error.value)) {
            return stringLengthMessage(error.min, error.max);
          } else {
            return sizeMessage(error.min, error.max, 'items');
          }
        },

        range: function(error) {
          if (_.isNumber(error.min) && _.isNumber(error.max)) {
            return 'Please enter a number between ' + error.min + ' and ' + error.max;
          } else if (_.isNumber(error.min)) {
            return 'Please enter a number no less than ' + error.min;
          } else {
            return 'Please enter a number no greater than ' + error.max;
          }
        },

        regexp: function() {
          return 'Input does not match the expected format. Please edit and try again.';
        },

        in: function(error) {
          return 'Must be one of ' + error.expected.join(', ') + '.';
        },

        required: function(error) {
          if (error.path.length === 1 && error.path[0] === 'fields') {
            return 'All fields are empty. Please fill out some fields.';
          } else {
            return 'Required';
          }
        },

        unique: function(error) {
          if (error.conflicting.length > 1) {
            return 'There are already entries with the same ${fieldName} field';
          } else {
            return "There's already an entry with the same ${fieldName} field";
          }
        }
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
        var getMessage = messages[error.name] || defaultMessage;
        return getMessage(error);
      }

      buildErrorMessage.size = sizeMessage;
      buildErrorMessage.stringLength = stringLengthMessage;

      return buildErrorMessage;
    }
  ])

  /**
   * @ngdoc service
   * @name fieldErrorMessageBuilder
   * @description
   * Creates error messages for Content Type fields.
   *
   * Extends the `baseErrorMessageBuilder` with special messages for the
   * `apiName` property of a CT field.
   *
   * @method {function (error:Error): string} fieldErrorMessageBuilder
   */
  .factory('fieldErrorMessageBuilder', [
    'baseErrorMessageBuilder',
    buildBaseMessage =>
      function buildMessage(error) {
        if (error.path && error.path[0] === 'apiName') {
          if (error.name === 'regexp' && error.value.match(/^\d/)) {
            return 'Please use a letter as the first character';
          }
          if (error.name === 'regexp') {
            return 'Please use only letters and numbers';
          }
          if (error.name === 'size') {
            return 'Please shorten the text so it’s no longer than 64 characters';
          }
          if (error.name === 'uniqueFieldId') {
            return 'A field with this ID already exists';
          }
        }
        return buildBaseMessage(error);
      }
  ])

  /**
   * @ngdoc service
   * @name errorMessageBuilder
   *
   * @description
   * Build error messages for Entries, Assets, and Content Types.
   *
   * The error messages for Entries are parameterized by the
   * repo of published content types.
   *
   * @method {(cts: Data.ContentTypeRepo.Published) => ((e:Error) => string)} errorMessageBuilder
   * @method {function(error:Error): string} errorMessageBuilder.forContentType
   * @method {function(error:Error): string} errorMessageBuilder.forAsset
   */
  .factory('errorMessageBuilder', [
    'require',
    require => {
      var moment = require('moment');
      var joinAnd = require('utils/StringUtils.es6').joinAnd;
      var mimetypeGroupNames = require('@contentful/mimetype').getGroupNames();
      var buildBaseErrorMessage = require('baseErrorMessageBuilder');

      var messages = {
        linkMimetypeGroup: function(error) {
          var labels = _.map(error.mimetypeGroupName, name => '“' + mimetypeGroupNames[name] + '”');
          return '' + joinAnd(labels) + ' are the only acceptable file types';
        },

        linkContentType: function(error, ctRepo) {
          var ct = ctRepo.get(error.contentTypeId);
          if (ct) {
            return 'Linked Entry’s content type must be ' + ct.getName() + '.';
          } else {
            return 'Invalid content type';
          }
        },

        dateRange: function(error) {
          var dateFormat = 'lll';
          var min = error.min && moment(error.min).format(dateFormat);
          var max = error.max && moment(error.max).format(dateFormat);

          if (min && max) {
            return 'Please set a date between ' + min + ' and ' + max;
          } else if (min) {
            return 'Please set a time no earlier than ' + min;
          } else {
            return 'Please set a time no later than ' + max;
          }
        },

        type: function(error) {
          if (error.details && (error.type === 'Validation' || error.type === 'Text')) {
            return error.details;
          } else if (error.type === 'Symbol') {
            return buildBaseErrorMessage.stringLength(null, 256);
          } else if (error.type.match(/^aeio/i)) {
            return 'Must be an ' + error.type + '.';
          } else {
            return 'Must be a ' + error.type + '.';
          }
        },

        notResolvable: function(error) {
          var type = _.get(error, 'link.linkType') || 'Entity';
          return 'Linked ' + type + ' does not exist';
        },

        unknown: function(error) {
          if (error.path.length === 3 && error.path[0] === 'fields') {
            return 'This field is not localized and should not contain a value.';
          } else if (error.path.length === 2 && error.path[0] === 'fields') {
            return 'Unknown field.';
          } else {
            return 'Unkown property.';
          }
        }
      };

      function customMessage(error) {
        return error.customMessage;
      }

      function buildErrorMessage(error, ctRepo) {
        var getMessage;
        if (error.customMessage) {
          getMessage = customMessage;
        } else {
          getMessage = messages[error.name] || buildBaseErrorMessage;
        }
        return getMessage(error, ctRepo);
      }

      function buildContentTypeError(error) {
        if (error.name === 'size' && error.path.length === 1 && error.path[0] === 'fields') {
          return (
            'You have reached the maximum number of ' + error.max + ' fields per content type.'
          );
        }
        if (error.name === 'uniqueFieldIds') {
          return 'Field ID must be unique';
        }
        if (error.name === 'uniqueFieldApiNames') {
          return 'Field API Name must be unique';
        }
        if (error.name === 'regexp' && error.path[2] === 'apiName') {
          return 'Please provide input that only contains letters and digits';
        } else {
          return buildErrorMessage(error);
        }
      }

      function buildAssetError(error) {
        if (
          error.name === 'required' &&
          error.path.length === 4 &&
          error.path[1] === 'file' &&
          error.path[3] === 'url'
        ) {
          return 'Cannot publish until processing has finished';
        } else {
          return buildErrorMessage(error);
        }
      }

      function errorMessageBuilder(ctRepo) {
        return error => buildErrorMessage(error, ctRepo);
      }

      errorMessageBuilder.forContentType = buildContentTypeError;
      errorMessageBuilder.forAsset = buildAssetError;

      return errorMessageBuilder;
    }
  ]);
