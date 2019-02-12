import {
  reducer,
  selectSidebarType,
  openWidgetConfiguration,
  closeWidgetConfiguration,
  removeItemFromSidebar,
  addItemToSidebar,
  changeItemPosition
} from './SidebarConfigurationReducer.es6';
import { SidebarType } from './constants.es6';

describe('EntrySidebar/Configuration/SidebarConfigurationReducer', () => {
  it('should change sidebar type from default to custom', () => {
    const nextState = reducer(
      {
        sidebarType: SidebarType.default
      },
      selectSidebarType(SidebarType.custom)
    );
    expect(nextState.sidebarType).toEqual(SidebarType.custom);
  });
  it('should open and close widget configuration', () => {
    let nextState = reducer(
      {
        configurableWidget: null
      },
      openWidgetConfiguration({ widgetId: '123' })
    );
    expect(nextState.configurableWidget).toEqual({ widgetId: '123' });
    nextState = reducer(nextState, closeWidgetConfiguration());
    expect(nextState.configurableWidget).toBeNull();
  });

  it('should remove item from sidebar', () => {
    const initialState = {
      items: [
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '3', widgetNamespace: 'first', problem: true }
      ],
      availableItems: []
    };
    let nextState = reducer(
      initialState,
      removeItemFromSidebar({
        widgetId: '1',
        widgetNamespace: 'first'
      })
    );

    expect(nextState).toEqual({
      items: [
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '3', widgetNamespace: 'first', problem: true }
      ],
      availableItems: [{ widgetId: '1', widgetNamespace: 'first' }]
    });

    nextState = reducer(
      nextState,
      removeItemFromSidebar({
        widgetId: '3',
        widgetNamespace: 'first'
      })
    );

    expect(nextState).toEqual({
      items: [{ widgetId: '2', widgetNamespace: 'second' }],
      availableItems: [{ widgetId: '1', widgetNamespace: 'first' }]
    });
  });

  it('should add item from available to items', () => {
    const initialState = {
      items: [],
      availableItems: [
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '2', widgetNamespace: 'second' }
      ]
    };
    const nextState = reducer(
      initialState,
      addItemToSidebar({
        widgetId: '1',
        widgetNamespace: 'first'
      })
    );

    const expectedState = {
      items: [{ widgetId: '1', widgetNamespace: 'first' }],
      availableItems: [{ widgetId: '2', widgetNamespace: 'second' }]
    };

    expect(nextState).toEqual(expectedState);

    expect(
      reducer(
        nextState,
        addItemToSidebar({
          widgetId: 'some-other-item',
          widgetNamespace: 'third'
        })
      )
    ).toEqual(expectedState);
  });

  it('should swap items', () => {
    const initialState = {
      items: [
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '3', widgetNamespace: 'first' }
      ]
    };
    let nextState = reducer(initialState, changeItemPosition(0, 2));
    expect(nextState).toEqual({
      items: [
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '3', widgetNamespace: 'first' },
        { widgetId: '1', widgetNamespace: 'first' }
      ]
    });
    nextState = reducer(nextState, changeItemPosition(1, 2));
    expect(nextState).toEqual({
      items: [
        { widgetId: '2', widgetNamespace: 'second' },
        { widgetId: '1', widgetNamespace: 'first' },
        { widgetId: '3', widgetNamespace: 'first' }
      ]
    });
  });
});
