import React, { useReducer, useEffect } from 'react';
import { pick, difference } from 'lodash';
import { css } from 'emotion';
import { reducer } from 'app/EntrySidebar/Configuration/SidebarConfigurationReducer'; // Replace
import { State } from 'app/EntrySidebar/Configuration/SidebarConfigurationReducer';
import WidgetsConfiguration from 'app/ContentModel/Editor/WidgetsConfiguration';
import { ConfigurationItem } from 'app/ContentModel/Editor/WidgetsConfiguration/interfaces';
import { create } from 'widgets/BuiltinWidgets';
import { WidgetNamespace, WidgetLocation } from 'features/widget-renderer';
import WidgetParametersConfiguration from 'app/EntrySidebar/Configuration/WidgetParametersConfiguration'; // Replace

const styles = {
  container: css({
    margin: '0 auto',
    marginBottom: '60px',
  }),
};

interface CustomWidget {
  name: string;
  namespace: WidgetNamespace;
  id: string;
  locations: WidgetLocation[];
}
function isCustomWidget(widget: CustomWidget | DefaultWidget): widget is CustomWidget {
  return (
    (widget as CustomWidget).id !== undefined && (widget as CustomWidget).namespace !== undefined
  );
}

interface DefaultWidget {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name: string;
}

interface SavedConfigItem {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  disabled?: boolean;
  settings: Record<string, any>;
}

interface EditorConfigProps {
  onUpdateConfiguration: (configuration: SavedConfigItem[] | undefined) => void;
  defaultWidgets: DefaultWidget[];
  customWidgets: CustomWidget[];
  configuration: SavedConfigItem[];
}

const convertToWidgetConfiguration = (widget: CustomWidget | DefaultWidget): ConfigurationItem => {
  if (isCustomWidget(widget)) {
    return {
      widgetId: widget.id,
      widgetNamespace: widget.namespace,
      name: widget.name,
      ...pick(widget, ['description', 'locations', 'parameters', 'availabilityStatus', 'settings']),
    };
  } else {
    return {
      widgetId: widget.widgetId,
      widgetNamespace: widget.widgetNamespace,
      name: widget.name,
      ...pick(widget, ['description', 'locations', 'parameters', 'availabilityStatus', 'settings']),
    };
  }
};

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

const enrichWidgetData = (defaultWidgets: DefaultWidget[], customWidgets: CustomWidget[]) => (
  item: SavedConfigItem
) =>
  isWidgetBuiltIn(item)
    ? defaultWidgets.find((widget) => item.widgetId === widget.widgetId)
    : customWidgets.find((widget) => item.widgetId === widget.id);

function createStateFromConfiguration(
  configuration: SavedConfigItem[],
  defaultWidgets: DefaultWidget[],
  customWidgets: CustomWidget[]
): State {
  if (configuration.length === 0) {
    return {
      items: defaultWidgets.map(convertToWidgetConfiguration),
      availableItems: customWidgets.map(convertToWidgetConfiguration),
      configurableWidget: null,
    };
  }

  const unusedDefaultEditors = findUnusedDefaultWidgets(defaultWidgets, configuration);

  const items = configuration
    .filter(isWidgetEnabled)
    .map(enrichWidgetData(defaultWidgets, customWidgets))
    .concat(unusedDefaultEditors)
    .filter((item) => !!item) as (CustomWidget | DefaultWidget)[];

  return {
    items: items.map(convertToWidgetConfiguration),
    availableItems: customWidgets.map(convertToWidgetConfiguration),
    configurableWidget: null,
  };
}

function convertInternalStateToConfiguration(
  state: any,
  initialItems: any
): SavedConfigItem[] | undefined {
  if (state.items === initialItems) {
    return undefined;
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

function EntryEditorConfiguration(props: EditorConfigProps) {
  const { onUpdateConfiguration, defaultWidgets, customWidgets, configuration } = props;

  const [state, dispatch] = useReducer<React.Reducer<State, any>>(
    reducer,
    createStateFromConfiguration(configuration, defaultWidgets, customWidgets)
  );

  useEffect(() => {
    onUpdateConfiguration(convertInternalStateToConfiguration(state, defaultWidgets));
  }, [state, onUpdateConfiguration, defaultWidgets]);

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

export default (props: Omit<EditorConfigProps, 'defaultWidgets'>) => {
  const defaultWidgets = create().map(convertToWidgetConfiguration).filter(isWidgetBuiltIn);

  return <EntryEditorConfiguration {...props} defaultWidgets={defaultWidgets} />;
};
