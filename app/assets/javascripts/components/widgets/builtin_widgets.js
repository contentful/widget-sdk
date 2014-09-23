'use strict';
angular.module('contentful').run(['widgetTypes', function(widgetTypes){
  widgetTypes.registerWidget('singleLine',{
    fieldTypes: ['Text', 'Symbol'],
    name: 'Single Line',
    template: '<input class="form-control" ng-disabled="!otEditable" ng-model="fieldData.value" ot-bind-text="" ot-subdoc="" type="text">'
  });
  widgetTypes.registerWidget('numberEditor',{
    fieldTypes: ['Integer', 'Number'],
    name: 'Number Editor',
    template: '<div class="cf-number-editor"></div>'
  });
  widgetTypes.registerWidget('multipleLine',{
    fieldTypes: ['Text'],
    name: 'Multiple Line',
    template: '<textarea cf-input-autogrow class="form-control" ng-disabled="!otEditable" ng-model="fieldData.value" ot-bind-text ot-subdoc></textarea>'
  });
  widgetTypes.registerWidget('markdown',{
    fieldTypes: ['Text'],
    name: 'Markdown',
    template: '<div class="cf-markdown-editor"></div>'
  });
  widgetTypes.registerWidget('radio',{
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
    name: 'Radio',
    template: '<cf-radio-editor ng-model="fieldData.value" ot-bind-internal="valuesController.selected"></cf-radio-editor>'
  });
  widgetTypes.registerWidget('dropdown',{
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
    name: 'Dropdown',
    template: '<div class="cf-dropdown-editor" ng-model="fieldData.value" ot-bind-internal="valuesController.selected"></div>'
  });
  widgetTypes.registerWidget('rating',{
    fieldTypes: ['Integer', 'Number'],
    name: 'Rating',
    options: [
      {
        param: 'stars',
        type: 'Predefined',
        values: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
        name: 'Number of stars',
        default: 10
      }
    ],
    template: '<cf-rating-editor ng-model="fieldData.value" ot-bind-internal="rating"></cf-rating-editor>'
  });
  widgetTypes.registerWidget('datePicker',{
    fieldTypes: ['Date'],
    name: 'Date Picker',
    template: '<div class="cf-datetime-editor widget-datetime-editor" ng-model="fieldData.value"></div>'
  });
  widgetTypes.registerWidget('locationEditor',{
    fieldTypes: ['Location'],
    name: 'Location',
    template: '<div class="cf-location-editor widget-location-editor" ng-model="fieldData.value" ot-bind-internal="location"></div>'
  });
  widgetTypes.registerWidget('objectEditor',{
    fieldTypes: ['Object'],
    name: 'Object',
    template: '<div class="cf-object-editor" ng-model="fieldData.value"></div>'
  });
  widgetTypes.registerWidget('listInput',{
    fieldTypes: ['Symbols'],
    name: 'List',
    template: '<input cf-list-identity-fix="" class="form-control" ng-disabled="!otEditable" ng-list="" ng-model="fieldData.value" ot-bind-model="" type="text">'
  });
  widgetTypes.registerWidget('fileEditor',{
    fieldTypes: ['File'],
    name: 'File',
    template: '<div class="cf-file-editor" ng-model="fieldData.value" ot-bind-internal="file"></div>'
  });
  widgetTypes.registerWidget('linkEditor',{
    fieldTypes: ['Asset', 'Entry'],
    name: 'Link',
    template: '<div cf-link-editor="field.linkType" ng-model="fieldData.value"></div>'
  });
  widgetTypes.registerWidget('linksEditor',{
    fieldTypes: ['Assets', 'Entries'],
    name: 'Links',
    template: '<div cf-link-editor="field.items.linkType" link-multiple="true" ng-model="fieldData.value"></div>'
  });
  //toggle: {   NOT IMPLEMENTED
    //fieldTypes: ['Boolean'],
    //name: 'Toggle',
  //},
  //dateDropdown: { NOT IMPLEMENTED
    //fieldTypes: ['Date'],
    //name: 'Date Dropdown',
  //},
  //coordinates: { NOT IMPLEMENTED
    //fieldTypes: ['Location'],
    //name: 'Coordinates',
  //},
  //item: { NOT IMPLEMENTED
    //fieldTypes: ['File'],
    //name: 'Item',
  //},
  //card: { NOT IMPLEMENTED
    //fieldTypes: [],
    //name: 'Card',
  //},
  //gallery: { NOT IMPLEMENTED
    //fieldTypes: ['File'],
    //name: 'Gallery',
  //},
  //list: { NOT IMPLEMENTED
    //name: 'List',
  //},
}]);
