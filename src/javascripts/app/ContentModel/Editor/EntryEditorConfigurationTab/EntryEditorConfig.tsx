import React, { useReducer, useEffect } from 'react';
import { pick, difference } from 'lodash';
import { css } from 'emotion';
import { reducer } from 'app/EntrySidebar/Configuration/SidebarConfigurationReducer'; // Replace
import { State } from 'app/EntrySidebar/Configuration/SidebarConfigurationReducer';
import WidgetsConfiguration from 'app/ContentModel/Editor/WidgetsConfiguration';
import { ConfigurationItem } from 'app/ContentModel/Editor/WidgetsConfiguration/interfaces';
import { create } from 'widgets/BuiltinWidgets';
import { WidgetNamespace, Location } from 'features/widget-renderer';
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
  locations: Location[];
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

type ConvertToWidgetConfiguration = {
  (widget: CustomWidget): ConfigurationItem;
  (widget: DefaultWidget): ConfigurationItem;
  (widget: SavedConfigItem): ConfigurationItem;
};

const convertToWidgetConfiguration: ConvertToWidgetConfiguration = (widget): ConfigurationItem => ({
  widgetId: widget.id || widget.widgetId,
  widgetNamespace: widget.namespace || widget.widgetNamespace,
  ...pick(widget, [
    'name',
    'description',
    'locations',
    'parameters',
    'availabilityStatus',
    'settings',
  ]),
});

const findUnusedDefaultWidgets = (
  defaultWidgets: DefaultWidget[],
  configuration: SavedConfigItem[]
) => {
  return defaultWidgets.filter(
    widget =>
      !configuration.find(
        item =>
          item.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN &&
          widget.widgetId === item.widgetId
      )
  );
};

const removeDisabledWidgets = (widget: SavedConfigItem) => !widget.disabled;

const enrichWidgetData = (defaultWidgets: DefaultWidget[], customWidgets: CustomWidget[]) => (
  item: SavedConfigItem
) =>
  item.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN
    ? defaultWidgets.find(widget => item.widgetId === widget.widgetId)
    : customWidgets.find(widget => item.widgetId === widget.id);

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
    .filter(removeDisabledWidgets)
    .map(enrichWidgetData(defaultWidgets, customWidgets))
    .concat(unusedDefaultEditors)
    .filter(item => !!item);

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
    .filter((widget: any) => widget.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN)
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
            location: 'Tabs',
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
  const defaultEditors = create().filter(
    editor => editor.namespace === WidgetNamespace.EDITOR_BUILTIN
  );
  const defaultWidgets = defaultEditors.map(convertToWidgetConfiguration);

  return <EntryEditorConfiguration {...props} defaultWidgets={defaultWidgets} />;
};
