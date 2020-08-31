import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import EntryEditorConfig from './EntryEditorConfig';
import { WidgetNamespace, WidgetLocation } from '@contentful/widget-renderer';
import EntryEditorWidgetTypes from 'app/entry_editor/EntryEditorWidgetTypes';
import { noop } from 'lodash';

const DEFAULT_WIDGETS = [
  {
    widgetId: EntryEditorWidgetTypes.DEFAULT_EDITOR.id,
    widgetNamespace: WidgetNamespace.EDITOR_BUILTIN,
    name: EntryEditorWidgetTypes.DEFAULT_EDITOR.name,
  },
];

describe('EntryEditorConfig', () => {
  it('Renders all default items on empty state', async () => {
    const props = {
      onUpdateConfiguration: noop,
      async getDefaultEntryEditorConfiguration() {
        return DEFAULT_WIDGETS;
      },
      configuration: [],
      customWidgets: [],
    };

    const { getAllByTestId } = render(<EntryEditorConfig {...props} />);
    await wait();

    expect(getAllByTestId('selected-widget-item')).toHaveLength(DEFAULT_WIDGETS.length);
  });

  it('renders all available items on empty state', async () => {
    const customWidgets = [
      {
        id: 'app-1',
        namespace: WidgetNamespace.APP,
        settings: {},
        locations: [WidgetLocation.ENTRY_EDITOR],
        name: 'App 1',
      },
      {
        id: 'ext-1',
        namespace: WidgetNamespace.EXTENSION,
        settings: {},
        name: 'Ext 1',
        locations: [WidgetLocation.ENTRY_EDITOR],
      },
    ];
    const props = {
      onUpdateConfiguration: noop,
      async getDefaultEntryEditorConfiguration() {
        return Promise.resolve(DEFAULT_WIDGETS);
      },
      configuration: [],
      customWidgets,
    };
    const AVAILABLE_WIDGETS = customWidgets.length;

    const { getAllByTestId } = render(<EntryEditorConfig {...props} />);
    await wait();

    expect(getAllByTestId('available-widget')).toHaveLength(AVAILABLE_WIDGETS);
  });

  it('removing a selected item puts it back into the available column', async () => {
    const props = {
      onUpdateConfiguration: noop,
      async getDefaultEntryEditorConfiguration() {
        return Promise.resolve(DEFAULT_WIDGETS);
      },
      configuration: [],
      customWidgets: [],
    };

    const { getAllByTestId, queryByTestId, getByTestId } = render(<EntryEditorConfig {...props} />);
    await wait();

    expect(queryByTestId('available-widget')).toBeNull();
    expect(getAllByTestId('selected-widget-item')).toHaveLength(DEFAULT_WIDGETS.length);

    fireEvent.click(getByTestId('remove-selected-widget'));
    await wait();

    expect(getAllByTestId('available-widget')).toHaveLength(1);
    expect(queryByTestId('selected-widget-item')).toBeNull();
  });

  it('adding an available item puts it into the selected column and removes it from available column', async () => {
    const props = {
      onUpdateConfiguration: noop,
      async getDefaultEntryEditorConfiguration() {
        return Promise.resolve(DEFAULT_WIDGETS);
      },
      configuration: [],
      customWidgets: [
        {
          id: 'ext-1',
          namespace: WidgetNamespace.EXTENSION,
          settings: {},
          name: 'Ext 1',
          locations: [WidgetLocation.ENTRY_EDITOR],
        },
      ],
    };

    const { getAllByTestId, getByTestId, queryByTestId } = render(<EntryEditorConfig {...props} />);
    await wait();

    fireEvent.click(getByTestId('add-widget-to-selected'));

    expect(queryByTestId('available-widget')).toBeNull();
    expect(getAllByTestId('selected-widget-item')).toHaveLength(DEFAULT_WIDGETS.length + 1);
  });

  it('calls the update function only when configuration changes', async () => {
    const onUpdateConfiguration = jest.fn();
    const props = {
      onUpdateConfiguration,
      async getDefaultEntryEditorConfiguration() {
        return Promise.resolve(DEFAULT_WIDGETS);
      },
      configuration: [],
      customWidgets: [
        {
          id: 'ext-1',
          namespace: WidgetNamespace.EXTENSION,
          settings: {},
          name: 'Ext 1',
          locations: [WidgetLocation.ENTRY_EDITOR],
        },
      ],
    };

    const { getByTestId } = render(<EntryEditorConfig {...props} />);
    await wait();

    expect(onUpdateConfiguration).not.toHaveBeenCalled();

    fireEvent.click(getByTestId('add-widget-to-selected'));

    expect(onUpdateConfiguration).toHaveBeenCalledTimes(1);
  });
});
