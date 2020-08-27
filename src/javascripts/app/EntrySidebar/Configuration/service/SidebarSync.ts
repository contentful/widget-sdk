import { pick, difference, isEqual } from 'lodash';

import { defaultWidgetsMap } from '../defaults';

import { State } from 'app/ContentModel/Editor/WidgetsConfiguration/WidgetsConfigurationReducer';
import {
  ConfigurationItem,
  DefaultWidget,
  SavedConfigItem,
} from 'app/ContentModel/Editor/WidgetsConfiguration/interfaces';
import { WidgetNamespace, isCustomWidget, WidgetLocation } from '@contentful/widget-renderer';
import { isSameWidget } from 'app/ContentModel/Editor/WidgetsConfiguration/utils';

/**
 * Converts internal state of configuration reducer
 * to data that can be used in API calls to `/editor_inteface`
 * for saving configuration.
 */
export function convertInternalStateToConfiguration(
  state: State,
  initialItems: ConfigurationItem[]
) {
  if (isEqual(state.items, initialItems)) {
    return undefined;
  }

  const selectedDefaultIds = state.items
    .filter(
      (widget: ConfigurationItem) => widget.widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN
    )
    .map((widget: ConfigurationItem) => widget.widgetId);
  const defaultIds = initialItems.map((widget: ConfigurationItem) => widget.widgetId);
  const missingBuiltinIds = difference(defaultIds, selectedDefaultIds);

  const selectedItems = state.items.map((widget: ConfigurationItem) => ({
    widgetId: widget.widgetId,
    widgetNamespace: widget.widgetNamespace,
    settings: widget.settings || {},
  }));

  const missingItems = initialItems
    .filter((widget: ConfigurationItem) => missingBuiltinIds.includes(widget.widgetId))
    .map((widget: ConfigurationItem) => ({
      widgetId: widget.widgetId,
      widgetNamespace: widget.widgetNamespace,
      disabled: true,
    }));

  return [...selectedItems, ...missingItems];
}

function convertToWidgetConfiguration(widget: any) {
  return {
    widgetId: widget.id,
    widgetNamespace: widget.namespace,
    ...pick(widget, ['name', 'locations', 'parameters', 'disabled']),
  };
}

function canBeUsedInSidebar(widget: any) {
  // If a widget does not declare locations it can
  // be used in the sidebar. In general it's true
  // for Extensions.
  if (!Array.isArray(widget.locations)) {
    return true;
  }

  // Otherwise we check for entry sidebar location.
  return widget.locations.includes(WidgetLocation.ENTRY_SIDEBAR);
}

/**
 * Converts saved configuration state and list of available custom widgets
 * to initial state of configuration reducer, enriches saved configuration
 * with additional data needed to render UI.
 */
export function convertConfigurationToInternalState(
  configuration: SavedConfigItem[],
  widgets: DefaultWidget[],
  initialItems: ConfigurationItem[]
): State {
  if (!Array.isArray(configuration)) {
    return {
      items: initialItems,
      availableItems: widgets.filter(canBeUsedInSidebar).map(convertToWidgetConfiguration),
      configurableWidget: null,
    };
  }

  widgets = widgets.map(convertToWidgetConfiguration);

  const items: ConfigurationItem[] = configuration
    .reduce((acc: ConfigurationItem[], configItem) => {
      if (configItem.widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN) {
        const found = defaultWidgetsMap[configItem.widgetId];

        if (found) {
          acc.push({ ...configItem, name: found.name, description: found.description });
        }
        return acc;
      }

      if (isCustomWidget(configItem.widgetNamespace)) {
        const found = widgets.find((e: any) => isSameWidget(e, configItem));

        if (found) {
          // Settings have to be copied to the widget for
          // the updating of instance parameters to work
          acc.push({ ...found, ...pick(configItem, ['settings']) });
        }
        return acc;
      }

      return acc;
    }, [])
    .filter((item) => item.disabled !== true);

  const availableItems: ConfigurationItem[] = widgets.reduce((acc: ConfigurationItem[], widget) => {
    if (canBeUsedInSidebar(widget)) {
      acc.push(widget);
    }

    return acc;
  }, []);

  return {
    items,
    availableItems,
    configurableWidget: null,
  };
}
