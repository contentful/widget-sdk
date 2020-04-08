import { registerDirective } from 'NgRegistry';
import validation from '@contentful/validation';
import errorMessageBuilder from 'services/errorMessageBuilder/errorMessageBuilder';

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
SchemaController.prototype.setSchema = function (schema) {
  this.schema = schema;
};

/**
 * @ngdoc method
 * @name SchemaController#setContext
 * @param {Schema} schema
 */
SchemaController.prototype.setContext = function (context) {
  this.context = context;
};

/**
 * @ngdoc method
 * @name SchemaController#errors
 * @param data
 * @returns {Array<Error>}
 */
SchemaController.prototype.errors = function (data) {
  if (this.schema) {
    return this.schema.errors(data, this.context);
  }
};

SchemaController.prototype.buildMessage = function (error, data) {
  return this.messageBuilder(error, data);
};

export default function register() {
  /**
   * @ngdoc directive
   * @name cfContentTypeSchema
   * @usage[jade]
   * div(cf-validate="contentType" cf-content-type-schema)
   *
   * @property {SchemaController} $scope.schema
   */
  registerDirective('cfContentTypeSchema', [
    () => ({
      restrict: 'A',
      scope: true,
      controller: [
        '$scope',
        ($scope) => {
          const buildMessage = errorMessageBuilder.forContentType;
          $scope.schema = new SchemaController(buildMessage, validation.schemas.ContentType);
        },
      ],
    }),
  ]);
}
