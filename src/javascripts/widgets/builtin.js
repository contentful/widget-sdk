'use strict';
angular.module('contentful')
.factory('widgets/builtin', [function() {
  var _widgets = {};

  function registerWidget (id, desc) {
    _widgets[id] = _.extend({}, desc, {
      id: id,
      options: COMMON_OPTIONS.concat(desc.options || [])
    });
  }

  var COMMON_OPTIONS = [
    {
      param: 'helpText',
      name: 'Help text',
      type: 'Text',
      description: 'This help text will show up below the field'
    },
  ];

  /**
   * @ngdoc type
   * @name Widget.Descriptor
   *
   * @property {string} id
   * @property {string} name
   * @property {Widget.Option[]} options
   * @property {string} icon
   * @property {string} template
   * @property {string} defaulHelpText
   * @property {boolean} notFocusable
   * @property {boolean} rendersHelpText
   */

  registerWidget('singleLine',{
    fieldTypes: ['Text', 'Symbol'],
    name: 'Single Line',
    icon: 'singleline',
    template: '<cf-single-line-editor />'
  });

  registerWidget('urlEditor', {
    fieldTypes: ['Symbol'],
    name: 'URL',
    icon: 'preview',
    rendersHelpText: true,
    template: '<cf-url-editor class="widget-url-editor"></cf-url-editor>'
  });

  registerWidget('numberEditor',{
    fieldTypes: ['Integer', 'Number'],
    name: 'Number Editor',
    icon: 'number',
    template: '<div cf-number-editor class="cf-number-editor"></div>'
  });

  registerWidget('multipleLine',{
    fieldTypes: ['Text'],
    name: 'Multiple Line',
    icon: 'multipleline',
    template: '<textarea class="form-control" ng-disabled="isDisabled(field, locale)" ng-model="fieldData.value" ot-bind-text></textarea>'
  });

  registerWidget('markdown',{
    fieldTypes: ['Text'],
    name: 'Markdown',
    icon: 'markdown',
    template: '<cf-markdown-editor-bridge />'
  });

  registerWidget('dropdown',{
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number'],
    name: 'Dropdown',
    icon: 'dropdown',
    notFocusable: true,
    template: '<cf-dropdown-editor />'
  });

  registerWidget('radio',{
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number'],
    name: 'Radio',
    icon: 'radio',
    notFocusable: true,
    template: '<cf-radio-editor />'
  });

  registerWidget('boolean', {
    fieldTypes: ['Boolean'],
    name: 'Radio',
    icon: 'radio',
    notFocusable: true,
    template: '<cf-widget-boolean />',
    options: [{
      name: 'True condition custom label',
      param: 'trueLabel',
      type:  'short-text',
      description: 'Yes',
      default: 'Yes'
    }, {
      name: 'False condition custom label',
      param: 'falseLabel',
      type:  'short-text',
      description: 'No',
      default: 'No'
    }]
  });

  registerWidget('rating',{
    fieldTypes: ['Integer', 'Number'],
    name: 'Rating',
    icon: 'rating',
    options: [
      {
        param: 'stars',
        type: 'Predefined',
        values: _.range(1, 20),
        name: 'Number of stars',
        default: 5
      }
    ],
    notFocusable: true,
    template: '<cf-rating-editor ng-model="fieldData.value" ot-bind-object-value="rating"></cf-rating-editor>'
  });

  registerWidget('datePicker',{
    fieldTypes: ['Date'],
    name: 'Date Picker',
    template: '<div cf-datetime-editor class="widget-datetime-editor" ng-model="fieldData.value"></div>',
    notFocusable: true,
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
        default: '24',
        dependsOnAny: {
          format: ['time', 'timeZ']
        }
      }
    ]
  });

  registerWidget('locationEditor',{
    fieldTypes: ['Location'],
    name: 'Location',
    // Show the google maps widget alongwith the location editor widget. They share the same 'location' model.
    template: '<cf-google-maps ng-model="location" ot-bind-object-value="location"></cf-google-maps><div cf-location-editor class="widget-location-editor" ng-model="fieldData.value" ot-bind-object-value="location"></div>'
  });

  registerWidget('objectEditor',{
    fieldTypes: ['Object'],
    name: 'Object',
    template: '<div cf-object-editor class="cf-object-editor" ng-model="fieldData.value"></div>'
  });

  registerWidget('listInput',{
    fieldTypes: ['Symbols'],
    defaultHelpText: 'Insert comma separated values',
    name: 'List',
    icon: 'singleline',
    template: '<input cf-list-identity-fix class="form-control" ng-disabled="isDisabled(field, locale)" ng-list cf-empty-list ng-model="fieldData.value" ot-bind-ng-model type="text">'
  });

  registerWidget('fileEditor',{
    fieldTypes: ['File'],
    name: 'File',
    template: '<cf-file-editor class="widget-file-editor" />'
  });

  registerWidget('entryLinkEditor',{
    fieldTypes: ['Entry'],
    name: 'Entry Link',
    icon: 'reference',
    rendersHelpText: true,
    template: '<div cf-entry-link-editor cf-link-editor ng-model="fieldData.value"></div>'
  });

  registerWidget('assetLinkEditor',{
    fieldTypes: ['Asset'],
    name: 'Asset Link',
    icon: 'media-reference',
    rendersHelpText: true,
    template: '<div cf-asset-link-editor cf-link-editor ng-model="fieldData.value"></div>'
  });

  registerWidget('entryLinksEditor',{
    fieldTypes: ['Entries'],
    name: 'Entry Links List',
    icon: 'references',
    rendersHelpText: true,
    template: '<div cf-entry-link-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });

  registerWidget('entryCardEditor',{
    fieldTypes: ['Entry'],
    name: 'Entry Card',
    icon: 'reference-card',
    rendersHelpText: true,
    template: '<div cf-entry-card-editor cf-link-editor ng-model="fieldData.value"></div>'
  });

  registerWidget('entryCardsEditor',{
    fieldTypes: ['Entries'],
    name: 'Entry Cards',
    icon: 'references-card',
    rendersHelpText: true,
    template: '<div cf-entry-card-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });

  registerWidget('assetLinksEditor',{
    fieldTypes: ['Assets'],
    name: 'Asset Links List',
    icon: 'media-references',
    rendersHelpText: true,
    template: '<div cf-asset-link-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });

  registerWidget('assetGalleryEditor',{
    fieldTypes: ['Assets'],
    name: 'Asset Gallery',
    icon: 'media-previews',
    rendersHelpText: true,
    template: '<div cf-asset-gallery-editor cf-link-editor link-multiple="true" ng-model="fieldData.value"></div>'
  });

  registerWidget('slugEditor', {
    fieldTypes: ['Symbol'],
    name: 'Slug',
    icon: 'slug',
    template: '<cf-slug-editor class="widget-slug-editor"></cf-slug-editor>'
  });

  registerWidget('ooyalaEditor',{
    fieldTypes: ['Symbol'],
    name: 'Ooyala',
    icon: 'video-preview',
    rendersHelpText: true,
    template: '<cf-ooyala-editor></cf-ooyala-editor>'
  });

  registerWidget('ooyalaMultiAssetEditor',{
    fieldTypes: ['Symbols'],
    name: 'Ooyala (multiple assets)',
    icon: 'video-preview',
    rendersHelpText: true,
    template: '<cf-ooyala-multi-video-editor ng-model="fieldData.value" ot-bind-object-value="selectedAssets"></cf-ooyala-multi-video-editor>'
  });

  registerWidget('kalturaEditor',{
    fieldTypes: ['Symbol'],
    name: 'Kaltura',
    icon: 'video-preview',
    rendersHelpText: true,
    template: '<cf-kaltura-editor></cf-kaltura-editor>'
  });

  registerWidget('kalturaMultiVideoEditor',{
    fieldTypes: ['Symbols'],
    name: 'Kaltura (multiple videos)',
    icon: 'video-preview',
    rendersHelpText: true,
    template: '<cf-kaltura-multi-video-editor ng-model="fieldData.value" ot-bind-object-value="selectedAssets"></cf-kaltura-multi-video-editor>'
  });

  return _widgets;

}]);
