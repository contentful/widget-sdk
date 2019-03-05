import { range } from 'lodash';

const HELP_TEXT_PARAMETER = {
  id: 'helpText',
  name: 'Help text',
  type: 'Symbol',
  description: 'This help text will show up below the field'
};

// Returns a list of all builtin widgets.
export function create() {
  const widgets = [];

  const registerWidget = (id, widgetDescriptor) => {
    const widgetParameters = widgetDescriptor.parameters || [];
    const hasHelpText = !!widgetParameters.find(({ id }) => id === HELP_TEXT_PARAMETER.id);
    const parameters = (hasHelpText ? [] : [HELP_TEXT_PARAMETER]).concat(widgetParameters);

    Object.assign(widgetDescriptor, { id, parameters });
    widgets.push(widgetDescriptor);
  };

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
    parameters: [
      {
        id: 'trueLabel',
        name: 'True condition custom label',
        type: 'Symbol',
        default: 'Yes'
      },
      {
        id: 'falseLabel',
        name: 'False condition custom label',
        type: 'Symbol',
        default: 'No'
      }
    ]
  });

  const MAX_NUMBER_OF_STARS = 20;

  registerWidget('rating', {
    fieldTypes: ['Integer', 'Number'],
    name: 'Rating',
    icon: 'rating',
    parameters: [
      {
        id: 'stars',
        name: 'Number of stars',
        type: 'Enum',
        options: range(1, MAX_NUMBER_OF_STARS + 1).map(String),
        default: '5',
        required: true
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
    parameters: [
      {
        id: 'format',
        name: 'Format',
        type: 'Enum',
        options: [
          { dateonly: 'Date only' },
          { time: 'Date and time without timezone' },
          { timeZ: 'Date and time with timezone' }
        ],
        default: 'timeZ',
        required: true
      },
      {
        id: 'ampm',
        name: 'Time mode',
        type: 'Enum',
        options: [{ '12': 'AM/PM' }, { '24': '24 Hour' }],
        default: '24',
        required: true
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

  registerWidget('richTextEditor', {
    fieldTypes: ['RichText'],
    name: 'RichText',
    icon: 'json',
    template: '<cf-rich-text-editor />'
  });

  registerWidget('listInput', {
    fieldTypes: ['Symbols'],
    name: 'List',
    icon: 'singleline',
    template: '<cf-list-input-editor>',
    parameters: [
      {
        ...HELP_TEXT_PARAMETER,
        default: 'Insert comma separated values'
      }
    ]
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
    template:
      '<cf-reference-editor type="Entry" variant="link" single="true" load-events="loadEvents" />'
  });

  registerWidget('assetLinkEditor', {
    fieldTypes: ['Asset'],
    name: 'Asset link',
    icon: 'media-reference',
    template:
      '<cf-reference-editor type="Asset" variant="card" single="true" load-events="loadEvents" />'
  });

  const BULK_EDITOR_PARAMETER = {
    id: 'bulkEditing',
    name: 'Use bulk editing',
    description: 'Ideal for entries with only a few fields',
    type: 'Boolean',
    default: false
  };

  registerWidget('entryLinksEditor', {
    fieldTypes: ['Entries'],
    name: 'Entry links list',
    icon: 'references',
    template: '<cf-reference-editor type="Entry" variant="link" load-events="loadEvents" />',
    parameters: [BULK_EDITOR_PARAMETER]
  });

  registerWidget('entryCardEditor', {
    fieldTypes: ['Entry'],
    name: 'Entry card',
    icon: 'reference-card',
    template:
      '<cf-reference-editor type="Entry" variant="card" single="true" load-events="loadEvents" />'
  });

  registerWidget('entryCardsEditor', {
    fieldTypes: ['Entries'],
    name: 'Entry cards',
    icon: 'references-card',
    template: '<cf-reference-editor type="Entry" variant="card" load-events="loadEvents" />',
    parameters: [BULK_EDITOR_PARAMETER]
  });

  registerWidget('assetLinksEditor', {
    fieldTypes: ['Assets'],
    name: 'Asset links list',
    icon: 'media-references',
    template: '<cf-reference-editor type="Asset" variant="link" load-events="loadEvents" />'
  });

  registerWidget('assetGalleryEditor', {
    fieldTypes: ['Assets'],
    name: 'Asset gallery',
    icon: 'media-previews',
    template: '<cf-reference-editor type="Asset" variant="card" load-events="loadEvents" />'
  });

  registerWidget('slugEditor', {
    fieldTypes: ['Symbol'],
    name: 'Slug',
    icon: 'slug',
    template: '<cf-slug-editor />',
    // Slug editor needs to be rendered even if it's disabled.
    // It generates slugs automatically out of the title.
    // Right now this is the only "background" widget: when
    // disabled, it'll be rendered (but hidden) so it still
    // operates in the background.
    isBackground: true
  });

  return widgets;
}
