import React from 'react';
import { render, cleanup, wait, configure, fireEvent } from '@testing-library/react';
import EntryEditorConfig from './EntryEditorConfig';
import { WidgetNamespace } from 'features/widget-renderer';

configure({ testIdAttribute: 'data-test-id' });

describe('EntryEditorConfig', () => {
  afterEach(cleanup);

  it('Renders all default items on empty state', async () => {
    const props = {
      onUpdateConfiguration() {},
      configuration: [],
      customWidgets: [],
    };
    const DEFAULT_WIDGETS = 2;

    const { getAllByTestId } = render(<EntryEditorConfig {...props} />);
    await wait();

    expect(getAllByTestId('selected-widget-item')).toHaveLength(DEFAULT_WIDGETS);
  });

  it('renders all available items on empty state', async () => {
    const customWidgets = [
      {
        id: 'app-1',
        namespace: WidgetNamespace.APP,
        settings: {},
        locations: ['entry-editor'],
        name: 'App 1',
      },
      {
        id: 'ext-1',
        namespace: WidgetNamespace.EXTENSION,
        settings: {},
        name: 'Ext 1',
        locations: ['entry-editor'],
      },
    ];
    const props = {
      onUpdateConfiguration() {},
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
      onUpdateConfiguration() {},
      configuration: [],
      customWidgets: [],
    };
    const DEFAULT_WIDGETS = 2;

    const { getAllByTestId } = render(<EntryEditorConfig {...props} />);
    await wait();

    await fireEvent.click(getAllByTestId('remove-selected-widget')[0]);

    expect(getAllByTestId('available-widget')).toHaveLength(DEFAULT_WIDGETS - 1);
    expect(getAllByTestId('selected-widget-item')).toHaveLength(1);
  });

  it('adding an available item puts it into the selected column and removes it from available column', async () => {
    const props = {
      onUpdateConfiguration() {},
      configuration: [],
      customWidgets: [
        {
          id: 'ext-1',
          namespace: WidgetNamespace.EXTENSION,
          settings: {},
          name: 'Ext 1',
          locations: ['entry-editor'],
        },
      ],
    };
    const DEFAULT_WIDGETS = 2;

    const { getAllByTestId, getByTestId, queryByTestId } = render(<EntryEditorConfig {...props} />);
    await wait();

    await fireEvent.click(getByTestId('add-widget-to-selected'));

    expect(queryByTestId('available-widget')).toBeNull();
    expect(getAllByTestId('selected-widget-item')).toHaveLength(DEFAULT_WIDGETS + 1);
  });
});
