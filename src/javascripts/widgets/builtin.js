'use strict';
angular.module('contentful')
.factory('widgets/builtin', [function () {
  var _widgets = {};

  var COMMON_OPTIONS = [
    {
      param: 'helpText',
      name: 'Help text',
      type: 'Text',
      description: 'This help text will show up below the field'
    }
  ];


  function registerWidget (id, desc) {
    _widgets[id] = _.extend({}, desc, {
      id: id,
      options: COMMON_OPTIONS.concat(desc.options || [])
    });
  }
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

  registerWidget('singleLine', {
    fieldTypes: ['Text', 'Symbol'],
    name: 'Single line',
    icon: 'singleline',
    template: '<cf-single-line-editor />'
  });

  registerWidget('urlEditor', {
    fieldTypes: ['Symbol'],
    name: 'URL',
    icon: 'preview',
    rendersHelpText: true,
    template: '<cf-url-editor />'
  });

  registerWidget('numberEditor', {
    fieldTypes: ['Integer', 'Number'],
    name: 'Number editor',
    icon: 'number',
    template: '<cf-number-editor />'
  });

  registerWidget('multipleLine', {
    fieldTypes: ['Text'],
    name: 'Multiple line',
    icon: 'multipleline',
    template: '<cf-multi-line-editor />'
  });

  registerWidget('markdown', {
    fieldTypes: ['Text'],
    name: 'Markdown',
    icon: 'markdown',
    template: '<cf-markdown-editor />'
  });

  registerWidget('dropdown', {
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number'],
    name: 'Dropdown',
    icon: 'dropdown',
    notFocusable: true,
    template: '<cf-dropdown-editor />'
  });

  registerWidget('radio', {
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
    template: '<cf-boolean-editor />',
    options: [{
      name: 'True condition custom label',
      param: 'trueLabel',
      type: 'Text',
      description: 'Yes',
      default: 'Yes'
    }, {
      name: 'False condition custom label',
      param: 'falseLabel',
      type: 'Text',
      description: 'No',
      default: 'No'
    }]
  });

  registerWidget('rating', {
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
    template: '<cf-rating-editor />'
  });

  registerWidget('datePicker', {
    fieldTypes: ['Date'],
    name: 'Date picker',
    template: '<cf-entry-datetime-editor />',
    notFocusable: true,
    options: [
      {
        param: 'format',
        name: 'Format',
        type: 'Predefined',
        values: {
          dateonly: 'Date only',
          time: 'Date and time without timezone',
          timeZ: 'Date and time with timezone'
        },
        default: 'timeZ'
      },
      {
        param: 'ampm',
        name: 'Time mode',
        type: 'Predefined',
        values: {
          '12': 'AM/PM',
          '24': '24 Hour'
        },
        default: '24'
      }
    ]
  });

  registerWidget('locationEditor', {
    fieldTypes: ['Location'],
    name: 'Location',
    template: '<cf-location-editor />'
  });

  registerWidget('objectEditor', {
    fieldTypes: ['Object'],
    name: 'Object',
    template: '<cf-json-editor />'
  });

  registerWidget('listInput', {
    fieldTypes: ['Symbols'],
    defaultHelpText: 'Insert comma separated values',
    name: 'List',
    icon: 'singleline',
    template: '<cf-list-input-editor>'
  });

  registerWidget('checkbox', {
    fieldTypes: ['Symbols'],
    name: 'Checkbox',
    icon: 'checkbox',
    template: '<cf-checkbox-editor />'
  });

  registerWidget('tagEditor', {
    fieldTypes: ['Symbols'],
    name: 'Tag',
    icon: 'tags',
    template: '<cf-tag-editor />'
  });

  registerWidget('fileEditor', {
    fieldTypes: ['File'],
    name: 'File',
    template: '<cf-file-editor class="widget-file-editor" />'
  });

  registerWidget('entryLinkEditor', {
    fieldTypes: ['Entry'],
    name: 'Entry link',
    icon: 'reference',
    template: '<cf-reference-editor type="Entry" variant="link" single="true" />'
  });

  registerWidget('assetLinkEditor', {
    fieldTypes: ['Asset'],
    name: 'Asset link',
    icon: 'media-reference',
    template: '<cf-reference-editor type="Asset" variant="card" single="true" />'
  });


  var bulkEditorOption = {
    param: 'bulkEditing',
    type: 'Boolean',
    default: false,
    label: 'Use bulk editing',
    description: 'Ideal for entries with only a few fields'
  };

  registerWidget('entryLinksEditor', {
    fieldTypes: ['Entries'],
    name: 'Entry links list',
    icon: 'references',
    template: '<cf-reference-editor type="Entry" variant="link" />',
    options: [bulkEditorOption]
  });

  registerWidget('entryCardEditor', {
    fieldTypes: ['Entry'],
    name: 'Entry card',
    icon: 'reference-card',
    template: '<cf-reference-editor type="Entry" variant="card" single="true" />'
  });

  registerWidget('entryCardsEditor', {
    fieldTypes: ['Entries'],
    name: 'Entry cards',
    icon: 'references-card',
    template: '<cf-reference-editor type="Entry" variant="card" />',
    options: [bulkEditorOption]
  });

  registerWidget('assetLinksEditor', {
    fieldTypes: ['Assets'],
    name: 'Asset links list',
    icon: 'media-references',
    template: '<cf-reference-editor type="Asset" variant="link" />'
  });

  registerWidget('assetGalleryEditor', {
    fieldTypes: ['Assets'],
    name: 'Asset gallery',
    icon: 'media-previews',
    template: '<cf-reference-editor type="Asset" variant="card" />'
  });

  registerWidget('slugEditor', {
    fieldTypes: ['Symbol'],
    name: 'Slug',
    icon: 'slug',
    template: '<cf-slug-editor />'
  });

  registerWidget('ooyalaEditor', {
    fieldTypes: ['Symbol'],
    name: 'Ooyala',
    icon: 'video-preview',
    rendersHelpText: true,
    template: '<cf-ooyala-editor></cf-ooyala-editor>'
  });

  registerWidget('ooyalaMultiAssetEditor', {
    fieldTypes: ['Symbols'],
    name: 'Ooyala (multiple assets)',
    icon: 'video-preview',
    rendersHelpText: true,
    template: '<cf-ooyala-multi-video-editor />'
  });

  registerWidget('kalturaEditor', {
    fieldTypes: ['Symbol'],
    name: 'Kaltura',
    icon: 'video-preview',
    rendersHelpText: true,
    template: '<cf-kaltura-editor></cf-kaltura-editor>'
  });

  return _widgets;
}]);
