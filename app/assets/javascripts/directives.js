define([
  'angular',

  'directives/bucket_content',
  'directives/bucket_view',
  'directives/entry_editor',
  'directives/entry_list',
  'directives/model_onblur',
  'directives/offset_by_one',
  'directives/cf_field_editor',
  'directives/ot_bind',
  'directives/ot_bind_text',
  'directives/tablist_button',
  'directives/pagination',
  'directives/bucket_entry_types',
  'directives/entry_type_editor',
  'directives/entry_type_field_list',
  'directives/entry_type_field_list_row',
  'directives/date_from'
], function(angular){
  'use strict';

  var module = angular.module('directives', []);

  for(var i=1, l=arguments.length; i<l; i++){
    var d = arguments[i];
    module.directive(d.name, d.factory);
  }

  return module;
});
