define([
  'angular',

  'directives/bucket_content',
  'directives/bucket_view',
  'directives/entry_editor',
  'directives/entry_list',
  'directives/model_onblur',
  'directives/offset_by_one',
  'directives/cf_field_editor',
], function(angular){
  'use strict';

  var module = angular.module('directives', []);

  for(var i=1, l=arguments.length; i<l; i++){
    var d = arguments[i];
    module.directive(d.name, d.factory);
  }

  return module;
});
