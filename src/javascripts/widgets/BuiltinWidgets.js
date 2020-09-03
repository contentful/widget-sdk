/* eslint-disable react/prop-types */

import { range } from 'lodash';
import React from 'react';
import * as Config from 'Config';
import EmbedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';
import { RenderRichTextEditor } from 'app/widgets/RichText';
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
import {
  SingleEntryReferenceEditorWithTracking,
  SingleMediaEditorWithTracking,
  MultipleEntryReferenceEditorWithTracking,
  MultipleMediaEditorWithTracking,
} from 'app/widgets/ReferenceEditor';
import { SlugEditor } from '@contentful/field-editor-slug';
import EntryEditorTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import { WidgetNamespace } from '@contentful/widget-renderer';

const HELP_TEXT_PARAMETER = {
  id: 'helpText',
  name: 'Help text',
  type: 'Symbol',
  description: 'This help text will show up below the field',
};

// Returns a list of all builtin widgets.
export function create() {
  const widgets = [];

  const registerWidget = (id, widgetDescriptor) => {
    const widgetParameters = widgetDescriptor.parameters || [];
    const hasHelpText = !!widgetParameters.find(({ id }) => id === HELP_TEXT_PARAMETER.id);
    const parameters = (hasHelpText ? [] : [HELP_TEXT_PARAMETER]).concat(widgetParameters);

    Object.assign(widgetDescriptor, { id, namespace: WidgetNamespace.BUILTIN, parameters });
    widgets.push(widgetDescriptor);
  };

  const registerEditorWidget = (editorDescriptor) => {
    const descriptor = {
      namespace: WidgetNamespace.EDITOR_BUILTIN,
    };
    Object.assign(descriptor, editorDescriptor);
    widgets.push(descriptor);
  };

  Object.values(EntryEditorTypes).map(registerEditorWidget);

  registerWidget('singleLine', {
    fieldTypes: ['Text', 'Symbol'],
    name: 'Single line',
    icon: 'singleline',
    renderFieldEditor: ({ widgetApi, entityType }) => (
      <SingleLineEditor
        field={widgetApi.field}
        locales={widgetApi.locales}
        // we don't want to show default validation for Asset title,
        // because asset title can be more than 256 characters
        withCharValidation={entityType !== 'Asset'}
      />
    ),
  });

  registerWidget('multipleLine', {
    fieldTypes: ['Text'],
    name: 'Multiple line',
    icon: 'multipleline',
    renderFieldEditor: ({ widgetApi }) => (
      <MultipleLineEditor field={widgetApi.field} locales={widgetApi.locales} />
    ),
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
    },
  });

  registerWidget('numberEditor', {
    fieldTypes: ['Integer', 'Number'],
    name: 'Number editor',
    icon: 'number',
    renderFieldEditor: ({ widgetApi }) => <NumberEditor field={widgetApi.field} />,
  });

  registerWidget('markdown', {
    fieldTypes: ['Text'],
    name: 'Markdown',
    icon: 'markdown',
    renderFieldEditor: ({ widgetApi }) => {
      const sdk = Object.assign({}, widgetApi);

      const previewComponents = {
        embedly: ({ url }) => <EmbedlyPreview previewUrl={url} delay={100} />,
      };

      sdk.dialogs.openCurrent = openMarkdownDialog(sdk, previewComponents);

      return <MarkdownEditor sdk={sdk} previewComponents={previewComponents} />;
    },
  });

  registerWidget('dropdown', {
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number'],
    name: 'Dropdown',
    icon: 'dropdown',
    notFocusable: true,
    renderFieldEditor: ({ widgetApi }) => (
      <DropdownEditor field={widgetApi.field} locales={widgetApi.locales} />
    ),
  });

  registerWidget('radio', {
    fieldTypes: ['Text', 'Symbol', 'Integer', 'Number'],
    name: 'Radio',
    icon: 'radio',
    notFocusable: true,
    renderFieldEditor: ({ widgetApi }) => (
      <RadioEditor field={widgetApi.field} locales={widgetApi.locales} />
    ),
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
        default: 'Yes',
      },
      {
        id: 'falseLabel',
        name: 'False condition custom label',
        type: 'Symbol',
        default: 'No',
      },
    ],
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
        required: true,
      },
    ],
    notFocusable: true,
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
          { timeZ: 'Date and time with timezone' },
        ],
        default: 'timeZ',
        required: true,
      },
      {
        id: 'ampm',
        name: 'Time mode',
        type: 'Enum',
        options: [{ '12': 'AM/PM' }, { '24': '24 Hour' }],
        default: '24',
        required: true,
      },
    ],
  });

  registerWidget('locationEditor', {
    fieldTypes: ['Location'],
    name: 'Location',
    renderFieldEditor: ({ widgetApi }) => (
      <LocationEditor
        field={widgetApi.field}
        parameters={{ instance: { googleMapsKey: Config.services.google.maps_api_key } }}
      />
    ),
  });

  registerWidget('objectEditor', {
    fieldTypes: ['Object'],
    name: 'Object',
    renderFieldEditor: ({ widgetApi }) => (
      <JsonEditor field={widgetApi.field} parameters={widgetApi.parameters} />
    ),
  });

  registerWidget('richTextEditor', {
    fieldTypes: ['RichText'],
    name: 'RichText',
    icon: 'wysiwig',
    renderFieldEditor: ({ widgetApi, loadEvents }) => (
      <RenderRichTextEditor sdk={widgetApi} loadEvents={loadEvents} />
    ),
  });

  registerWidget('tagEditor', {
    fieldTypes: ['Symbols'],
    name: 'Tag',
    icon: 'tags',
    renderFieldEditor: ({ widgetApi }) => <TagsEditor field={widgetApi.field} />,
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
        default: 'Insert comma separated values',
      },
    ],
  });

  registerWidget('checkbox', {
    fieldTypes: ['Symbols'],
    name: 'Checkbox',
    icon: 'checkbox',
    renderFieldEditor: ({ widgetApi }) => (
      <CheckboxEditor field={widgetApi.field} locales={widgetApi.locales} />
    ),
  });

  registerWidget('fileEditor', {
    fieldTypes: ['File'],
    name: 'File',
    renderFieldEditor: ({ widgetApi }) => {
      return <FileEditor sdk={widgetApi} />;
    },
  });

  const getShowCreateEntityActionParam = (entity) => {
    const name = entity === 'Entry' ? 'entries' : 'assets';
    return {
      id: 'showCreateEntityAction',
      name: `Show "Create new ${name}"`,
      description: `When enabled, people can create and link new ${name} (based on user permissions)`,
      type: 'Boolean',
      default: true,
    };
  };

  const getShowLinkEntityActionParam = (entity) => {
    const name = entity === 'Entry' ? 'entries' : 'assets';
    return {
      id: 'showLinkEntityAction',
      name: `Show "Link existing ${name}"`,
      description: `When enabled, people can link existing ${name} (based on user permissions)`,
      type: 'Boolean',
      default: true,
    };
  };

  registerWidget('entryLinkEditor', {
    fieldTypes: ['Entry'],
    name: 'Entry link',
    icon: 'reference',
    renderFieldEditor: ({ widgetApi, loadEvents }) => {
      return (
        <SingleEntryReferenceEditorWithTracking
          viewType="link"
          sdk={widgetApi}
          loadEvents={loadEvents}
        />
      );
    },
    parameters: [getShowCreateEntityActionParam('Entry'), getShowLinkEntityActionParam('Entry')],
  });

  registerWidget('entryCardEditor', {
    fieldTypes: ['Entry'],
    name: 'Entry card',
    icon: 'reference-card',
    renderFieldEditor: ({ widgetApi, loadEvents }) => {
      return (
        <SingleEntryReferenceEditorWithTracking
          viewType="card"
          sdk={widgetApi}
          loadEvents={loadEvents}
        />
      );
    },
    parameters: [getShowCreateEntityActionParam('Entry'), getShowLinkEntityActionParam('Entry')],
  });

  // NOTE: We render this as "card" ever since we got rid of the actual "link" appearance
  // option for single assets some time in 2016.
  registerWidget('assetLinkEditor', {
    fieldTypes: ['Asset'],
    name: 'Asset card',
    icon: 'media-preview',
    renderFieldEditor: ({ widgetApi, loadEvents }) => {
      return (
        <SingleMediaEditorWithTracking viewType="card" sdk={widgetApi} loadEvents={loadEvents} />
      );
    },
    parameters: [getShowCreateEntityActionParam('Asset'), getShowLinkEntityActionParam('Asset')],
  });

  const BULK_EDITOR_PARAMETER = {
    id: 'bulkEditing',
    name: 'Use bulk editing',
    description: 'Ideal for entries with only a few fields',
    type: 'Boolean',
    default: false,
  };

  registerWidget('entryLinksEditor', {
    fieldTypes: ['Entries'],
    name: 'Entry links list',
    icon: 'references',
    renderFieldEditor: ({ widgetApi, loadEvents }) => {
      return (
        <MultipleEntryReferenceEditorWithTracking
          viewType="link"
          sdk={widgetApi}
          loadEvents={loadEvents}
        />
      );
    },
    parameters: [
      BULK_EDITOR_PARAMETER,
      getShowCreateEntityActionParam('Entry'),
      getShowLinkEntityActionParam('Entry'),
    ],
  });

  registerWidget('entryCardsEditor', {
    fieldTypes: ['Entries'],
    name: 'Entry cards',
    icon: 'references-card',
    renderFieldEditor: ({ widgetApi, loadEvents }) => {
      return (
        <MultipleEntryReferenceEditorWithTracking
          viewType="card"
          sdk={widgetApi}
          loadEvents={loadEvents}
        />
      );
    },
    parameters: [
      BULK_EDITOR_PARAMETER,
      getShowCreateEntityActionParam('Entry'),
      getShowLinkEntityActionParam('Entry'),
    ],
  });

  registerWidget('assetLinksEditor', {
    fieldTypes: ['Assets'],
    name: 'Asset links list',
    icon: 'media-references',
    renderFieldEditor: ({ widgetApi, loadEvents }) => {
      return (
        <MultipleMediaEditorWithTracking viewType="link" sdk={widgetApi} loadEvents={loadEvents} />
      );
    },
    parameters: [getShowCreateEntityActionParam('Asset'), getShowLinkEntityActionParam('Asset')],
  });

  registerWidget('assetGalleryEditor', {
    fieldTypes: ['Assets'],
    name: 'Asset gallery',
    icon: 'media-previews',
    renderFieldEditor: ({ widgetApi, loadEvents }) => {
      return (
        <MultipleMediaEditorWithTracking viewType="card" sdk={widgetApi} loadEvents={loadEvents} />
      );
    },
    parameters: [getShowCreateEntityActionParam('Asset'), getShowLinkEntityActionParam('Asset')],
  });

  registerWidget('slugEditor', {
    fieldTypes: ['Symbol'],
    name: 'Slug',
    icon: 'slug',
    isBackground: true,
    renderFieldEditor: ({ widgetApi }) => {
      return <SlugEditor field={widgetApi.field} baseSdk={widgetApi} />;
    },
  });

  return widgets;
}
