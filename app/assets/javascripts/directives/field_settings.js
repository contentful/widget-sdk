angular.module('contentful/directives').directive('fieldSettings', function() {
  'use strict';

  return {
    restrict: 'C',
    template: JST['field_settings'](),
    controller: 'FieldSettingsCtrl'
  };
});
