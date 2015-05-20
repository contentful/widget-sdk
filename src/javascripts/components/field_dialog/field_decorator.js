'use strict';

angular.module('contentful')
.factory('fieldDecorator', ['$injector', function ($injector) {
  var schemas     = $injector.get('validation').schemas;
  var fieldSchema = schemas.ContentType.atItems(['fields']);

  var fieldProperties = [
    'id', 'name', 'apiName',
    'type', 'linkType',
    'localized', 'required', 'disabled'
  ];

  function decorate (field, contentType) {
    var isTitle = (contentType.data.displayField === field.id);
    return _.extend(_.pick(field, fieldProperties), {
      displayName: getDisplayFieldName(field),
      isTitle: isTitle,
      canBeTitle: isTitleField(field.type),
      apiName: field.apiName || field.id
    });
  }

  function extract (decoratedField) {
    return _.pick(decoratedField, fieldProperties);
  }

  function update (decoratedField, field, contentType) {
    _.extend(field, extract(decoratedField));
    var isTitle = decoratedField.isTitle;
    if (isTitle)
      contentType.data.displayField = field.id;
    else if (contentType.data.displayField === field.id && !isTitle)
      contentType.data.displayField = null;
  }

  /**
   * Returns an array of errors for a decorated field.
   */
  function validate (field) {
    return fieldSchema.errors(extract(field));
  }

  return {
    decorate: decorate,
    update:   update,
    validate: validate,
    getDisplayName: getDisplayFieldName
  };

  function isTitleField (fieldType) {
    return fieldType === 'Symbol' || fieldType === 'Text';
  }

  function getDisplayFieldName (field) {
    if (_.isEmpty(field.name)) {
      if ( _.isEmpty(field.id))
        return 'Untitled field';
      else
        return 'ID: ' + field.id;
    } else {
      return field.name;
    }
  }
}]);
