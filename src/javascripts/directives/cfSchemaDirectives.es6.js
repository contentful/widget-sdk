'use strict';

/**
 * @ngdoc directive
 * @name cfContentTypeSchema
 * @usage[jade]
 * div(cf-validate="contentType" cf-content-type-schema)
 *
 * @property {SchemaController} $scope.schema
 */
angular.module('contentful').directive('cfContentTypeSchema', [
  'require',
  require => {
    const errorMessageBuilder = require('errorMessageBuilder');
    const SchemaController = require('SchemaController');
    const validation = require('@contentful/validation');

    return {
      restrict: 'A',
      scope: true,
      controller: [
        '$scope',
        $scope => {
          const buildMessage = errorMessageBuilder.forContentType;
          $scope.schema = new SchemaController(buildMessage, validation.schemas.ContentType);
        }
      ]
    };
  }
]);

/**
 * @ngdoc type
 * @name SchemaController
 *
 * @description
 * The Schema Controller validates data against a schema creates
 * error messages.
 */
angular.module('contentful').factory('SchemaController', [
  () => {
    function SchemaController(messageBuilder, schema) {
      this.messageBuilder = messageBuilder;
      this.context = {};
      this.setSchema(schema);
    }

    /**
     * @ngdoc method
     * @name SchemaController#setSchema
     * @param {Schema} schema
     */
    SchemaController.prototype.setSchema = function(schema) {
      this.schema = schema;
    };

    /**
     * @ngdoc method
     * @name SchemaController#setContext
     * @param {Schema} schema
     */
    SchemaController.prototype.setContext = function(context) {
      this.context = context;
    };

    /**
     * @ngdoc method
     * @name SchemaController#errors
     * @param data
     * @returns {Array<Error>}
     */
    SchemaController.prototype.errors = function(data) {
      if (this.schema) {
        return this.schema.errors(data, this.context);
      }
    };

    SchemaController.prototype.buildMessage = function(error, data) {
      return this.messageBuilder(error, data);
    };

    return SchemaController;
  }
]);
