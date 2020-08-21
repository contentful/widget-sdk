import React, { useReducer, useEffect } from 'react';
import { pick, difference } from 'lodash';
import { css } from 'emotion';
import { reducer } from 'app/EntrySidebar/Configuration/SidebarConfigurationReducer'; // Replace
import { State } from 'app/EntrySidebar/Configuration/SidebarConfigurationReducer';
import WidgetsConfiguration from 'app/ContentModel/Editor/WidgetsConfiguration';
import { create } from 'widgets/BuiltinWidgets';
import { WidgetNamespace } from 'features/widget-renderer';
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

interface ConfigurationItem {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  disabled?: boolean;
  settings: Record<string, any>;
}

interface EditorConfigProps {
  onUpdateConfiguration: (configuration: ConfigurationItem[] | undefined) => void;
  defaultWidgets: DefaultWidget[];
  customWidgets: CustomWidget[];
  configuration: ConfigurationItem[];
}

// yikes
const convertToWidgetConfiguration = (widget) => ({
  widgetId: widget.id || widget.widgetId,
  widgetNamespace: widget.namespace || widget.widgetNamespace,
  ...pick(widget, ['name', 'locations', 'parameters']),
});

const findUnusedDefaultWidgets = (
  defaultWidgets: DefaultWidget[],
  configuration: ConfigurationItem[]
) => {
  return defaultWidgets.filter(
    (widget) =>
      !configuration.find(
        (item) =>
          item.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN &&
          widget.widgetId === item.widgetId
      )
  );
};

const removeDisabledWidgets = (widget: ConfigurationItem) => !widget.disabled;

const enrichWidgetData = (defaultWidgets: DefaultWidget[], customWidgets: CustomWidget[]) => (
  item: ConfigurationItem
) =>
  item.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN
    ? defaultWidgets.find((widget) => item.widgetId === widget.widgetId)
    : customWidgets.find((widget) => item.widgetId === widget.id);

function createStateFromConfiguration(
  configuration: ConfigurationItem[],
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
    .filter((item) => !!item);

  return {
    items: items.map(convertToWidgetConfiguration),
    availableItems: customWidgets.map(convertToWidgetConfiguration),
    configurableWidget: null,
  };
}

function convertInternalStateToConfiguration(
  state: any,
  initialItems: any
): ConfigurationItem[] | undefined {
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
    (editor) => editor.namespace === WidgetNamespace.EDITOR_BUILTIN
  );
  const defaultWidgets = defaultEditors.map(convertToWidgetConfiguration);

  return <EntryEditorConfiguration {...props} defaultWidgets={defaultWidgets} />;
};
