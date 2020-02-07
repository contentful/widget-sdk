/* eslint-disable react/prop-types */

import { range } from 'lodash';
import React from 'react';
import * as Config from 'Config';
import { NAMESPACE_BUILTIN } from './WidgetNamespaces';
import { default as RichTextEditor } from 'app/widgets/rich_text';
import LinkEditor, {
  SingleLinkEditor,
  withCfWebApp as linkEditorWithCfWebApp
} from 'app/widgets/LinkEditor';
import EmbedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';
import { TagsEditor } from '@contentful/field-editor-tags';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { MultipleLineEditor } from '@contentful/field-editor-multiple-line';
import { DropdownEditor } from '@contentful/field-editor-dropdown';
import { ListEditor } from '@contentful/field-editor-list';
import { CheckboxEditor } from '@contentful/field-editor-checkbox';
import { RadioEditor } from '@contentful/field-editor-radio';
import { BooleanEditor } from '@contentful/field-editor-boolean';
import { RatingEditor } from '@contentful/field-editor-rating';
import { NumberEditor } from '@contentful/field-editor-number';
import { UrlEditor } from '@contentful/field-editor-url';
import { JsonEditor } from '@contentful/field-editor-json';
import { LocationEditor } from '@contentful/field-editor-location';
import { DateEditor } from '@contentful/field-editor-date';
import { MarkdownEditor, openMarkdownDialog } from '@contentful/field-editor-markdown';
import FileEditor from 'app/widgets/FileEditor';
import { canUploadMultipleAssets } from 'access_control/AccessChecker';

const CfLinkEditor = linkEditorWithCfWebApp(LinkEditor);
const CfSingleLinkEditor = linkEditorWithCfWebApp(SingleLinkEditor);

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

    Object.assign(widgetDescriptor, { id, namespace: NAMESPACE_BUILTIN, parameters });
    widgets.push(widgetDescriptor);
  };

  registerWidget('singleLine', {
    fieldTypes: ['Text', 'Symbol'],
    name: 'Single line',
    icon: 'singleline',
    renderFieldEditor: ({ widgetApi }) => (
      <SingleLineEditor field={widgetApi.field} locales={widgetApi.locales} />
    )
  });

  registerWidget('multipleLine', {
    fieldTypes: ['Text'],
    name: 'Multiple line',
    icon: 'multipleline',
    renderFieldEditor: ({ widgetApi }) => (
      <MultipleLineEditor field={widgetApi.field} locales={widgetApi.locales} />
    )
  });

  registerWidget('urlEditor', {
    fieldTypes: ['Symbol'],
    name: 'URL',
    icon: 'preview',
    renderFieldEditor: ({ widgetApi }) => {
      return (
        <UrlEditor field={widgetApi.field}>
          {({ value }) => {
            return <EmbedlyPreview previewUrl={value} />;
          }}
        </UrlEditor>
      );
    }
  });

  registerWidget('numberEditor', {
    fieldTypes: ['Integer', 'Number'],
    name: 'Number editor',
    icon: 'number',
    renderFieldEditor: ({ widgetApi }) => <NumberEditor field={widgetApi.field} />
  });

  registerWidget('markdown', {
    fieldTypes: ['Text'],
    name: 'Markdown',
    icon: 'markdown',
    renderWhen: async () => {
      return {
        renderFieldEditor: ({ widgetApi }) => {
          const sdk = Object.assign({}, widgetApi);

          const previewComponents = {
            embedly: ({ url }) => <EmbedlyPreview previewUrl={url} delay={100} />
          };

          sdk.dialogs.openExtension = openMarkdownDialog(sdk, previewComponents);

          return (
            <MarkdownEditor
              sdk={sdk}
              parameters={Object.assign({}, widgetApi.parameters, {
                instance: {
                  canUploadAssets: canUploadMultipleAssets()
                }
              })}
              previewComponents={previewComponents}
            />
          );
        }
      };
    }
  });

  registerWidget('dropdown', {
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number'],
    name: 'Dropdown',
    icon: 'dropdown',
    notFocusable: true,
    renderFieldEditor: ({ widgetApi }) => (
      <DropdownEditor field={widgetApi.field} locales={widgetApi.locales} />
    )
  });

  registerWidget('radio', {
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number'],
    name: 'Radio',
    icon: 'radio',
    notFocusable: true,
    renderFieldEditor: ({ widgetApi }) => (
      <RadioEditor field={widgetApi.field} locales={widgetApi.locales} />
    )
  });

  registerWidget('boolean', {
    fieldTypes: ['Boolean'],
    name: 'Radio',
    icon: 'radio',
    notFocusable: true,
    renderFieldEditor: ({ widgetApi }) => (
      <BooleanEditor field={widgetApi.field} parameters={widgetApi.parameters} />
    ),
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
    renderFieldEditor: ({ widgetApi }) => (
      <RatingEditor field={widgetApi.field} parameters={widgetApi.parameters} />
    ),
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
    notFocusable: true
  });

  registerWidget('datePicker', {
    fieldTypes: ['Date'],
    name: 'Date picker',
    notFocusable: true,
    renderFieldEditor: ({ widgetApi }) => (
      <DateEditor field={widgetApi.field} parameters={widgetApi.parameters} />
    ),
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
    renderFieldEditor: ({ widgetApi }) => (
      <LocationEditor
        field={widgetApi.field}
        parameters={{ instance: { googleMapsKey: Config.services.google.maps_api_key } }}
      />
    )
  });

  registerWidget('objectEditor', {
    fieldTypes: ['Object'],
    name: 'Object',
    renderFieldEditor: ({ widgetApi }) => (
      <JsonEditor field={widgetApi.field} parameters={widgetApi.parameters} />
    )
  });

  registerWidget('richTextEditor', {
    fieldTypes: ['RichText'],
    name: 'RichText',
    icon: 'wysiwig',
    buildTemplate: ({ widgetApi, loadEvents }) => {
      // TODO: Just provide `widgetApi` via `WidgetApiContext`
      //  directly in `cfWidgetRendererDirective` and merge
      //  app/widgets/WidgetApi/buildWidgetApi.js
      //  with `cfWidgetApiDirective`.
      return <RichTextEditor widgetApi={widgetApi} loadEvents={loadEvents} />;
    }
  });

  registerWidget('tagEditor', {
    fieldTypes: ['Symbols'],
    name: 'Tag',
    icon: 'tags',
    renderFieldEditor: ({ widgetApi }) => <TagsEditor field={widgetApi.field} />
  });

  registerWidget('listInput', {
    fieldTypes: ['Symbols'],
    name: 'List',
    icon: 'singleline',
    renderFieldEditor: ({ widgetApi }) => (
      <ListEditor field={widgetApi.field} locales={widgetApi.locales} />
    ),
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
    renderFieldEditor: ({ widgetApi }) => (
      <CheckboxEditor field={widgetApi.field} locales={widgetApi.locales} />
    )
  });

  registerWidget('fileEditor', {
    fieldTypes: ['File'],
    name: 'File',
    renderFieldEditor: ({ widgetApi }) => {
      return <FileEditor sdk={widgetApi} />;
    }
  });

  registerWidget('entryLinkEditor', {
    fieldTypes: ['Entry'],
    name: 'Entry link',
    icon: 'reference',
    buildTemplate: ({ widgetApi, loadEvents }) => (
      <CfSingleLinkEditor type="Entry" style="link" widgetApi={widgetApi} loadEvents={loadEvents} />
    )
  });

  // NOTE: We render this as "card" ever since we got rid of the actual "link" appearance
  // option for single assets some time in 2016.
  registerWidget('assetLinkEditor', {
    fieldTypes: ['Asset'],
    name: 'Asset card',
    icon: 'media-preview',
    buildTemplate: ({ widgetApi, loadEvents }) => (
      <CfSingleLinkEditor type="Asset" style="card" widgetApi={widgetApi} loadEvents={loadEvents} />
    )
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
    buildTemplate: ({ widgetApi, loadEvents }) => (
      <CfLinkEditor type="Entry" style="link" widgetApi={widgetApi} loadEvents={loadEvents} />
    ),
    parameters: [BULK_EDITOR_PARAMETER]
  });

  registerWidget('entryCardEditor', {
    fieldTypes: ['Entry'],
    name: 'Entry card',
    icon: 'reference-card',
    buildTemplate: ({ widgetApi, loadEvents }) => (
      <CfSingleLinkEditor type="Entry" style="card" widgetApi={widgetApi} loadEvents={loadEvents} />
    )
  });

  registerWidget('entryCardsEditor', {
    fieldTypes: ['Entries'],
    name: 'Entry cards',
    icon: 'references-card',
    buildTemplate: ({ widgetApi, loadEvents }) => (
      <CfLinkEditor type="Entry" style="card" widgetApi={widgetApi} loadEvents={loadEvents} />
    ),
    parameters: [BULK_EDITOR_PARAMETER]
  });

  registerWidget('assetLinksEditor', {
    fieldTypes: ['Assets'],
    name: 'Asset links list',
    icon: 'media-references',
    buildTemplate: ({ widgetApi, loadEvents }) => (
      <CfLinkEditor type="Asset" style="link" widgetApi={widgetApi} loadEvents={loadEvents} />
    )
  });

  registerWidget('assetGalleryEditor', {
    fieldTypes: ['Assets'],
    name: 'Asset gallery',
    icon: 'media-previews',
    buildTemplate: ({ widgetApi, loadEvents }) => (
      <CfLinkEditor type="Asset" style="card" widgetApi={widgetApi} loadEvents={loadEvents} />
    )
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
