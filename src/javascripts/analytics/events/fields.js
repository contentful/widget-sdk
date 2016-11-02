'use strict';

angular.module('contentful')

.factory('analyticsEvents/fields', ['require', function (require) {
  var analytics = require('analytics');
  var getFieldLabel = require('fieldFactory').getLabel;

  return {
    action: action,
    added: added
  };

  function action (message, field, data) {
    analytics.track(message, _.extend({
      fieldId: field.id,
      originatingFieldType: getFieldLabel(field)
    }, data));
  }

  function added (contentType, field) {
    analytics.track('Modified ContentType', {
      action: 'add',
      contentTypeId: contentType.getId(),
      contentTypeName: contentType.getName(),
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      fieldSubtype: dotty.get(field, 'items.type') || null,
      fieldLocalized: field.localized,
      fieldRequired: field.required
    });
  }
}]);
