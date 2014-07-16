'use strict';
angular.module('contentful').factory('editingInterfaces', ['$injector', function($injector){
  var $q     = $injector.get('$q');
  var random = $injector.get('random');

  return {
    forContentType: function (contentType) {
      return $q.when([defaultInterface(contentType)]);
    }
  };

  function defaultInterface(contentType) {
    var config = {
      title: 'Default',
      id: random.id(),
      contentTypeId: contentType.getId(),
      widgets: []
    };
    config.widgets = _.map(contentType.data.fields, _.partial(defaultWidget, contentType));

    return config;
  }

  function defaultWidget(contentType, field) {
    return {
      type: 'field',
      fieldId: field.id, // TODO use internal id
      widgetType: fieldWidgetType(field, contentType),
      widgetOptions: {}
    };
  }

  // TODO: Copypasted from EntryEditorController. Won't be needed later, only intermediary
  function fieldWidgetType(field, contentType) {
    var hasValidations = getFieldValidationsOfType(field, 'in').length > 0;
    if(hasValidations) return 'dropdown';
    if (field.type === 'Symbol' ) {
      return 'textfield';
    }
    if (field.type === 'Text'   ) {
      if (contentType.data.displayField === field.id) {
        return 'textarea';
      } else {
        return 'markdownEditor';
      }
    }
    if (field.type === 'Boolean') return 'radiobuttons';
    if (field.type === 'Date'   ) return 'datetimeEditor';
    if (field.type === 'Array') {
      if (field.items.type === 'Link'  ) return 'linksEditor';
      if (field.items.type === 'Symbol') return 'listInput';
    }
    if (field.type === 'Object'  ) return 'objectEditor';
    if (field.type === 'Location') return 'locationEditor';
    if (field.type === 'Number'  ) return 'numberEditor';
    if (field.type === 'Integer' ) return 'numberEditor';
    if (field.type === 'Link'    ) return 'linkEditor';
    if (field.type === 'File'    ) return 'fileEditor';
    return null;
  }

  function getFieldValidationsOfType(field, type) {
    return _.filter(_.pluck(field.validations, type));
  }

}]);
