import {
  reducer,
  openWidgetConfiguration,
  closeWidgetConfiguration,
  removeItemFromSidebar,
  addItemToSidebar,
  changeItemPosition,
} from './SidebarConfigurationReducer';

describe('EntrySidebar/Configuration/SidebarConfigurationReducer', () => {
  it('should open and close widget configuration', () => {
    let nextState = reducer(
      {
        configurableWidget: null,
      },
      openWidgetConfiguration({ widgetId: '123' })
    );
    expect(nextState.configurableWidget).toEqual({ widgetId: '123' });
    nextState = reducer(nextState, closeWidgetConfiguration());
    expect(nextState.configurableWidget).toBeNull();
  });

  it('should remove item from items list on sidebar but not add it to availableItems', () => {
    const initialState = {
      items: [
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '3', widgetNamespace: 'first', problem: true },
      ],
      availableItems: [],
    };
    let nextState = reducer(
      initialState,
      removeItemFromSidebar({
        widgetId: '1',
        widgetNamespace: 'first',
      })
    );

    expect(nextState).toEqual({
      items: [
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '3', widgetNamespace: 'first', problem: true },
      ],
      availableItems: [],
    });

    nextState = reducer(
      nextState,
      removeItemFromSidebar({
        widgetId: '3',
        widgetNamespace: 'first',
      })
    );

    expect(nextState).toEqual({
      items: [{ widgetId: '2', widgetNamespace: 'second' }],
      availableItems: [],
    });
  });

  it('should add item from available to items', () => {
    const initialState = {
      items: [
        {
          widgetId: '3',
          widgetNamespace: 'second',
        },
      ],
      availableItems: [
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '2', widgetNamespace: 'second' },
      ],
    };
    const nextState = reducer(
      initialState,
      addItemToSidebar({
        widgetId: '1',
        widgetNamespace: 'first',
      })
    );

    const expectedState = {
      items: [
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '3', widgetNamespace: 'second' },
      ],
      availableItems: [
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '2', widgetNamespace: 'second' },
      ],
    };

    expect(nextState).toEqual(expectedState);
  });

  it('should swap items', () => {
    const initialState = {
      items: [
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '3', widgetNamespace: 'first' },
      ],
    };
    let nextState = reducer(initialState, changeItemPosition(0, 2));
    expect(nextState).toEqual({
      items: [
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '3', widgetNamespace: 'first' },
        { widgetId: '1', widgetNamespace: 'first' },
      ],
    });
    nextState = reducer(nextState, changeItemPosition(1, 2));
    expect(nextState).toEqual({
      items: [
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '3', widgetNamespace: 'first' },
      ],
    });
  });
});
