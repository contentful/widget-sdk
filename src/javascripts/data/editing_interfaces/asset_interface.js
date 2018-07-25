'use strict';

angular.module('cf.data')

.factory('data/editingInterfaces/asset', ['require', require => {
  const assetFields = require('assetContentType').data.fields;

  const widgets = _.forEach([{
    fieldId: 'title',
    widgetId: 'singleLine'
  }, {
    fieldId: 'description',
    widgetId: 'singleLine'
  }, {
    fieldId: 'file',
    widgetId: 'fileEditor'
  }], assignField);

  return {
    widgets: widgets
  };

  function assignField (widget) {
    widget.field = _.find(assetFields, {id: widget.fieldId});
  }
}]);
