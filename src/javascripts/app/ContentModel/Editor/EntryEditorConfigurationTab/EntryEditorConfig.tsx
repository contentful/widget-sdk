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
  ConfigurationItem,
} from 'app/ContentModel/Editor/WidgetsConfiguration/interfaces';
import { useAsync } from 'core/hooks';
import { WidgetNamespace, WidgetLocation } from '@contentful/widget-renderer';
import WidgetParametersConfiguration from 'app/ContentModel/Editor/WidgetsConfiguration/WidgetParametersConfiguration';
import { isSameWidget } from 'app/ContentModel/Editor/WidgetsConfiguration/utils';

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
    (widget) => !configuration.find((item) => isWidgetBuiltIn(item) && isSameWidget(widget, item))
  );
};

const isWidgetEnabled = (widget: SavedConfigItem) => !widget.disabled;
const isWidgetBuiltIn = (widget: { widgetNamespace: WidgetNamespace }) =>
  widget.widgetNamespace === WidgetNamespace.EDITOR_BUILTIN;

const enrichWidgetData = (defaultWidgets: Widget[], customWidgets: Widget[]) => (
  item: SavedConfigItem
) => ({
  ...item,
  ...(isWidgetBuiltIn(item)
    ? defaultWidgets.find((widget) => isSameWidget(item, widget))
    : customWidgets.find((widget) => isSameWidget(item, widget))),
});

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
    .filter((item) => !!item) as ConfigurationItem[];

  return {
    items: items,
    availableItems: customWidgets,
    configurableWidget: null,
  };
}

function convertInternalStateToConfiguration(
  state: State,
  initialItems: Widget[]
): SavedConfigItem[] {
  if (isEqual(state.items, initialItems)) {
    // initialItems are the default widgets. We don't save the state in that
    // case
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
  getDefaultEntryEditorConfiguration: () => Promise<DefaultWidget[]>;
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

interface DefaultEditorsConfigResult {
  isLoading: boolean;
  error: any;
  data: any;
}

export default function EntryEditorConfigContainer(props: EditorConfigProps) {
  const { isLoading, error, data } = useAsync(
    props.getDefaultEntryEditorConfiguration
  ) as DefaultEditorsConfigResult;
  const customWidgets = props.customWidgets.map(convertToWidgetConfiguration);

  if (isLoading || error) {
    return null;
  }

  return (
    <EntryEditorConfiguration {...props} customWidgets={customWidgets} defaultWidgets={data} />
  );
}
