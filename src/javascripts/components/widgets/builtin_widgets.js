'use strict';
angular.module('contentful').run(['widgets', function(widgets){
  // Static widgets
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

  // Field widgets
  widgets.registerWidget('sectionBreak',{
    name: 'Section Break',
    template: '<hr class="layout-field--section-break" />'
  });
  widgets.registerWidget('singleLine',{
    fieldTypes: ['Text', 'Symbol'],
    name: 'Single Line',
    template: '<input class="form-control" ng-disabled="!otEditable" ng-model="fieldData.value" ot-bind-text ot-subdoc type="text">'
  });
  widgets.registerWidget('numberEditor',{
    fieldTypes: ['Integer', 'Number'],
    name: 'Number Editor',
    template: '<div cf-number-editor class="cf-number-editor"></div>'
  });
  widgets.registerWidget('multipleLine',{
    fieldTypes: ['Text'],
    name: 'Multiple Line',
    template: '<textarea cf-input-autogrow class="form-control" ng-disabled="!otEditable" ng-model="fieldData.value" ot-bind-text ot-subdoc></textarea>'
  });
  widgets.registerWidget('markdown',{
    fieldTypes: ['Text'],
    name: 'Markdown',
    template: '<div cf-markdown-editor class="cf-markdown-editor"></div>'
  });
  widgets.registerWidget('radio',{
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
    name: 'Radio',
    template: '<cf-radio-editor ng-model="fieldData.value" ot-bind-internal="valuesController.selected"></cf-radio-editor>'
  });
  widgets.registerWidget('dropdown',{
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'],
    name: 'Dropdown',
    template: '<div cf-dropdown-editor ng-model="fieldData.value" ot-bind-internal="valuesController.selected"></div>'
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
    template: '<div cf-datetime-editor class="widget-datetime-editor" ng-model="fieldData.value"></div>',
    options: [
      {
        param: 'format',
        name: 'Format',
        type: 'Predefined',
        values: {
          dateonly: 'Date only',
          time:     'Date and time without timezone',
          timeZ:    'Date and time with timezone',
          //unixtime: 'Unix Timestamp'
        },
        default: 'timeZ'
      },
      {
        param: 'ampm',
        name: 'Time Mode',
        type: 'Predefined',
        values: {
          '12': 'AM/PM',
          '24': '24 Hour'
        },
        default: '24'
      }
    ]
  });
  widgets.registerWidget('locationEditor',{
    fieldTypes: ['Location'],
    name: 'Location',
    // Show the google maps widget alongwith the location editor widget. They share the same 'location' model.
    template: '<cf-google-maps ng-model="location" ot-bind-internal="location"></cf-google-maps><div cf-location-editor class="widget-location-editor" ng-model="fieldData.value" ot-bind-internal="location"></div>'
  });
  widgets.registerWidget('objectEditor',{
    fieldTypes: ['Object'],
    name: 'Object',
    template: '<div cf-object-editor class="cf-object-editor" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('listInput',{
    fieldTypes: ['Symbols'],
    name: 'List',
    template: '<input cf-list-identity-fix class="form-control" ng-disabled="!otEditable" ng-list cf-empty-list ng-model="fieldData.value" ot-bind-model type="text">'
  });
  widgets.registerWidget('fileEditor',{
    fieldTypes: ['File'],
    name: 'File',
    template: '<div class="widget-file-editor" cf-file-display cf-file-editor ng-model="fieldData.value" ot-bind-internal="file"></div>'
  });
  widgets.registerWidget('entryLinkEditor',{
    fieldTypes: ['Entry'],
    name: 'Entry Link',
    rendersHelpText: true,
    template: '<div cf-entry-link-editor cf-link-editor ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('assetLinkEditor',{
    fieldTypes: ['Asset'],
    name: 'Asset Link',
    rendersHelpText: true,
    template: '<div cf-asset-link-editor cf-link-editor ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('entryLinksEditor',{
    fieldTypes: ['Entries'],
    name: 'Entry Links List',
    rendersHelpText: true,
    template: '<div cf-entry-link-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('entryCardEditor',{
    fieldTypes: ['Entry'],
    name: 'Entry Card',
    rendersHelpText: true,
    template: '<div cf-entry-card-editor cf-link-editor ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('entryCardsEditor',{
    fieldTypes: ['Entries'],
    name: 'Entry Cards',
    rendersHelpText: true,
    template: '<div cf-entry-card-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('assetLinksEditor',{
    fieldTypes: ['Assets'],
    name: 'Asset Links List',
    rendersHelpText: true,
    template: '<div cf-asset-link-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('assetGalleryEditor',{
    fieldTypes: ['Assets'],
    name: 'Asset Gallery',
    rendersHelpText: true,
    template: '<div cf-asset-gallery-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });
  widgets.registerWidget('youtubeEditor',{
    fieldTypes: ['Symbol'],
    name: 'Youtube',
    rendersHelpText: true,
    template: '<cf-youtube-editor></cf-youtube-editor>'
  });
  widgets.registerWidget('ooyalaEditor',{
    fieldTypes: ['Symbol'],
    name: 'Ooyala',
    rendersHelpText: true,
    template: '<cf-ooyala-editor></cf-ooyala-editor>'
  });
  widgets.registerWidget('ooyalaMultiAssetEditor',{
    fieldTypes: ['Symbols'],
    name: 'Ooyala (multiple assets)',
    rendersHelpText: true,
    template: '<cf-ooyala-multi-video-editor ng-model="fieldData.value" ot-bind-internal="selectedAssets"></cf-ooyala-multi-video-editor>'
  });
  widgets.registerWidget('kalturaEditor',{
    fieldTypes: ['Symbol'],
    name: 'Kaltura',
    rendersHelpText: true,
    template: '<cf-kaltura-editor></cf-kaltura-editor>'
  });
  widgets.registerWidget('kalturaMultiVideoEditor',{
    fieldTypes: ['Symbols'],
    name: 'Kaltura (multiple videos)',
    rendersHelpText: true,
    template: '<cf-kaltura-multi-video-editor ng-model="fieldData.value" ot-bind-internal="selectedAssets"></cf-kaltura-multi-video-editor>'
  });
  widgets.registerWidget('slugEditor', {
    fieldTypes: ['Symbol'],
    name: 'Slug',
    template: '<cf-slug-editor class="widget-slug-editor"></cf-slug-editor>'
  });
  widgets.registerWidget('urlEditor', {
    fieldTypes: ['Symbol'],
    name: 'URL',
    rendersHelpText: true,
    template: '<cf-url-editor class="widget-url-editor"></cf-url-editor>' +
              '<div class="form-widget__help-text">{{helpText}}</div>' +
              '<cf-embedly-preview></cf-embedly-preview>'
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
