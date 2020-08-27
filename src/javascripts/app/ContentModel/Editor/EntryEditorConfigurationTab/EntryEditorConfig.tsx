import React, { useReducer, useEffect } from 'react';
import { pick, difference, isEqual } from 'lodash';
import { css } from 'emotion';
import {
  State,
  reducer,
} from 'app/ContentModel/Editor/WidgetsConfiguration/WidgetsConfigurationReducer';
import WidgetsConfiguration from 'app/ContentModel/Editor/WidgetsConfiguration';
import {
  CustomWidget,
  DefaultWidget,
  SavedConfigItem,
} from 'app/ContentModel/Editor/WidgetsConfiguration/interfaces';
import { create } from 'widgets/BuiltinWidgets';
import { WidgetNamespace, WidgetLocation } from '@contentful/widget-renderer';
import WidgetParametersConfiguration from 'app/ContentModel/Editor/WidgetsConfiguration/WidgetParametersConfiguration';

const styles = {
  container: css({
    margin: '0 auto',
    marginBottom: '60px',
  }),
};

interface Widget {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name: string;
  locations?: WidgetLocation[];
}

interface InternalEditorConfigProps {
  onUpdateConfiguration: (configuration: SavedConfigItem[]) => void;
  defaultWidgets: Widget[];
  customWidgets: Widget[];
  configuration: SavedConfigItem[];
}

const findUnusedDefaultWidgets = (
  defaultWidgets: DefaultWidget[],
  configuration: SavedConfigItem[]
) => {
  return defaultWidgets.filter(
    (widget) =>
      !configuration.find((item) => isWidgetBuiltIn(item) && widget.widgetId === item.widgetId)
  );
};

const isWidgetEnabled = (widget: SavedConfigItem) => !widget.disabled;
const isWidgetBuiltIn = (widget: { widgetNamespace: WidgetNamespace }) =>
  widget.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN;

const enrichWidgetData = (defaultWidgets: Widget[], customWidgets: Widget[]) => (
  item: SavedConfigItem
) =>
  isWidgetBuiltIn(item)
    ? defaultWidgets.find((widget) => item.widgetId === widget.widgetId)
    : customWidgets.find((widget) => item.widgetId === widget.widgetId);

function createStateFromConfiguration(
  configuration: SavedConfigItem[],
  defaultWidgets: Widget[],
  customWidgets: Widget[]
): State {
  if (configuration.length === 0) {
    return {
      items: defaultWidgets,
      availableItems: customWidgets,
      configurableWidget: null,
    };
  }

  const unusedDefaultEditors = findUnusedDefaultWidgets(defaultWidgets, configuration);

  const items = configuration
    .filter(isWidgetEnabled)
    .map(enrichWidgetData(defaultWidgets, customWidgets))
    .concat(unusedDefaultEditors)
    .filter((item) => !!item) as Widget[];

  return {
    items: items,
    availableItems: customWidgets,
    configurableWidget: null,
  };
}

function convertInternalStateToConfiguration(state: State, initialItems: any): SavedConfigItem[] {
  if (isEqual(state.items, initialItems)) {
    return [];
  }

  const selectedDefaultIds = state.items
    .filter(isWidgetBuiltIn)
    .map((widget: any) => widget.widgetId);
  const defaultIds = initialItems.map((widget: any) => widget.widgetId);
  const missingBuiltinIds = difference(defaultIds, selectedDefaultIds);

  const selectedItems = state.items
    .filter((widget: any) => widget.problem !== true)
    .map((widget: any) => ({
      widgetId: widget.widgetId,
      widgetNamespace: widget.widgetNamespace,
      settings: widget.settings || {},
    }));

  const missingItems = initialItems
    .filter((widget: any) => missingBuiltinIds.includes(widget.widgetId))
    .map((widget: any) => ({
      widgetId: widget.widgetId,
      widgetNamespace: widget.widgetNamespace,
      disabled: true,
    }));

  return [...selectedItems, ...missingItems];
}

function EntryEditorConfiguration(props: InternalEditorConfigProps) {
  const { onUpdateConfiguration, defaultWidgets, customWidgets, configuration } = props;

  const [state, dispatch] = useReducer<React.Reducer<State, any>>(
    reducer,
    createStateFromConfiguration(configuration, defaultWidgets, customWidgets)
  );

  useEffect(() => {
    const draftState = convertInternalStateToConfiguration(state, defaultWidgets);
    if (!isEqual(draftState, configuration)) {
      onUpdateConfiguration(draftState);
    }
  }, [state, onUpdateConfiguration, defaultWidgets, configuration]);

  return (
    <div className={styles.container}>
      {state.configurableWidget === null && (
        <WidgetsConfiguration
          state={state}
          dispatch={dispatch}
          defaultAvailableItems={defaultWidgets}
          configuration={{
            location: 'Entry editors',
            description: 'Configure the tabs of the entry editor for this content type.',
            inAppHelpMedium: 'use-customer-editors-available-items',
          }}
        />
      )}
      {state.configurableWidget !== null && (
        <WidgetParametersConfiguration widget={state.configurableWidget} dispatch={dispatch} />
      )}
    </div>
  );
}

interface EditorConfigProps {
  onUpdateConfiguration: (configuration: SavedConfigItem[]) => void;
  customWidgets: CustomWidget[];
  configuration: SavedConfigItem[];
}

const convertToWidgetConfiguration = (widget: any) => {
  return {
    name: widget.name,
    widgetId: widget.id || widget.widgetId,
    widgetNamespace: widget.namespace || widget.widgetNamespace,
    ...pick(widget, ['description', 'locations', 'parameters', 'availabilityStatus', 'settings']),
  };
};

export default (props: EditorConfigProps) => {
  const defaultWidgets = create().map(convertToWidgetConfiguration).filter(isWidgetBuiltIn);
  const customWidgets = props.customWidgets.map(convertToWidgetConfiguration);

  return (
    <EntryEditorConfiguration
      {...props}
      customWidgets={customWidgets}
      defaultWidgets={defaultWidgets}
    />
  );
};
