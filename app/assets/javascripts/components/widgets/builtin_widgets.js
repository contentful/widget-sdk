'use strict';
angular.module('contentful').run(['widgets', function(widgets){
  widgets.registerWidget('singleLine',{
    fieldTypes: ['Text', 'Symbol'],
    name: 'Single Line',
    template: '<input class="form-control" ng-disabled="!otEditable" ng-model="fieldData.value" ot-bind-text="" ot-subdoc="" type="text">'
  });
  widgets.registerWidget('numberEditor',{
    fieldTypes: ['Integer', 'Number'],
    name: 'Number Editor',
    template: '<div class="cf-number-editor"></div>'
  });
  widgets.registerWidget('multipleLine',{
    fieldTypes: ['Text'],
    name: 'Multiple Line',
    template: '<textarea cf-input-autogrow class="form-control" ng-disabled="!otEditable" ng-model="fieldData.value" ot-bind-text ot-subdoc></textarea>'
  });
  widgets.registerWidget('markdown',{
    fieldTypes: ['Text'],
    name: 'Markdown',
    template: '<div class="cf-markdown-editor"></div>'
  });
  widgets.registerWidget('radio',{
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
    name: 'Radio',
    template: '<cf-radio-editor ng-model="fieldData.value" ot-bind-internal="valuesController.selected"></cf-radio-editor>'
  });
  widgets.registerWidget('dropdown',{
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
    name: 'Dropdown',
    template: '<div class="cf-dropdown-editor" ng-model="fieldData.value" ot-bind-internal="valuesController.selected"></div>'
  });
  widgets.registerWidget('rating',{
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
  widgets.registerWidget('datePicker',{
    fieldTypes: ['Date'],
    name: 'Date Picker',
    template: '<div class="cf-datetime-editor widget-datetime-editor" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('locationEditor',{
    fieldTypes: ['Location'],
    name: 'Location',
    template: '<div class="cf-location-editor widget-location-editor" ng-model="fieldData.value" ot-bind-internal="location"></div>'
  });
  widgets.registerWidget('objectEditor',{
    fieldTypes: ['Object'],
    name: 'Object',
    template: '<div class="cf-object-editor" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('listInput',{
    fieldTypes: ['Symbols'],
    name: 'List',
    template: '<input cf-list-identity-fix="" class="form-control" ng-disabled="!otEditable" ng-list="" ng-model="fieldData.value" ot-bind-model="" type="text">'
  });
  widgets.registerWidget('fileEditor',{
    fieldTypes: ['File'],
    name: 'File',
    template: '<div class="widget-file-editor" cf-file-display cf-file-editor ng-model="fieldData.value" ot-bind-internal="file"></div>'
  });
  widgets.registerWidget('entryLinkEditor',{
    fieldTypes: ['Entry'],
    name: 'Entry Link',
    template: '<div cf-entry-link-editor cf-link-editor ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('assetLinkEditor',{
    fieldTypes: ['Asset'],
    name: 'Asset Link',
    template: '<div cf-asset-link-editor cf-link-editor ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('entryLinksEditor',{
    fieldTypes: ['Entries'],
    name: 'Entry Links List',
    template: '<div cf-entry-link-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('assetLinksEditor',{
    fieldTypes: ['Assets'],
    name: 'Asset Links List',
    template: '<div cf-asset-link-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('assetGalleryEditor',{
    fieldTypes: ['Assets'],
    name: 'Asset Gallery',
    template: '<div cf-asset-gallery-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('sectionHeader',{
    name: 'Section Header',
    template: '<h1 class="layout-field--section-header">{{widget.widgetParams.text}}</h1>',
    options: [
      { param: 'text', type: 'Text', name: 'Text' }
    ]
  });
  widgets.registerWidget('infoText',{
    name: 'Info Text',
    template: '<p class="layout-field--info-text">{{widget.widgetParams.text}}</p>',
    options: [
      { param: 'text', type: 'Text', name: 'Text' }
    ]
  });
  widgets.registerWidget('sectionBreak',{
    name: 'Section Break',
    template: '<hr class="layout-field--section-break" />'
  });
  widgets.registerWidget('youtubeEditor',{
    fieldTypes: ['Symbol'],
    name: 'Youtube',
    template: '<cf-youtube-editor></cf-youtube-editor>'
  });
  widgets.registerWidget('ooyalaEditor',{
    fieldTypes: ['Symbol'],
    name: 'Ooyala',
    template: '<cf-ooyala-editor></cf-ooyala-editor>'
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
