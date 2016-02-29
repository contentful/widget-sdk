'use strict';

angular.module('cf.data')
.constant('data/editingInterfaces/asset', {
  widgets: [{
    fieldId: 'title',
    widgetId: 'singleLine'
  }, {
    fieldId: 'description',
    widgetId: 'singleLine'
  }, {
    fieldId: 'file',
    widgetId: 'fileEditor'
  }]
});
