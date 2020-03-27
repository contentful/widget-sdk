import { pick, difference, identity } from 'lodash';

import { defaultWidgetsMap } from '../defaults';
import { SidebarType } from '../constants';

import {
  NAMESPACE_SIDEBAR_BUILTIN,
  NAMESPACE_EXTENSION,
  NAMESPACE_APP,
} from 'widgets/WidgetNamespaces';
import { LOCATION_ENTRY_SIDEBAR } from 'widgets/WidgetLocations';

/**
 * Converts internal state of configuration reducer
 * to data that can be used in API calls to `/editor_inteface`
 * for saving configuration.
 */
export function convertInternalStateToConfiguration(state, initialItems) {
  if (state.sidebarType === SidebarType.default) {
    return undefined;
  }

  const selectedDefaultIds = state.items
    .filter((widget) => widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN)
    .map((widget) => widget.widgetId);
  const defaultIds = initialItems.map((widget) => widget.widgetId);
  const missingBuiltinIds = difference(defaultIds, selectedDefaultIds);

  const selectedItems = state.items
    .filter((widget) => widget.problem !== true)
    .map((widget) => ({
      widgetId: widget.widgetId,
      widgetNamespace: widget.widgetNamespace,
      settings: widget.settings || {},
    }));

  const missingItems = initialItems
    .filter((widget) => missingBuiltinIds.includes(widget.widgetId))
    .map((widget) => ({
      widgetId: widget.widgetId,
      widgetNamespace: widget.widgetNamespace,
      disabled: true,
    }));

  return [...selectedItems, ...missingItems];
}

function convertToWidgetConfiguration(widget) {
  return {
    widgetId: widget.id,
    widgetNamespace: widget.namespace,
    ...pick(widget, ['name', 'locations', 'parameters']),
  };
}

function canBeUsedInSidebar(widget) {
  // If a widget does not declare locations it can
  // be used in the sidebar. In general it's true
  // for Extensions.
  if (!Array.isArray(widget.locations)) {
    return true;
  }

  // Otherwise we check for entry sidebar location.
  return widget.locations.includes(LOCATION_ENTRY_SIDEBAR);
}

/**
 * Converts saved configuration state and list of available custom widgets
 * to initial state of configuration reducer, enriches saved configuration
 * with additional data needed to render UI.
 */
export function convertConfigurationToInternalState(configuration, widgets, initialItems) {
  if (!Array.isArray(configuration)) {
    return {
      sidebarType: SidebarType.default,
      items: initialItems,
      availableItems: widgets.filter(canBeUsedInSidebar).map(convertToWidgetConfiguration),
      configurableWidget: null,
    };
  }

  widgets = widgets.map(convertToWidgetConfiguration);

  // Mark unavailable widgets with `problem: true`.
  let items = configuration
    .map((configItem) => {
      if (configItem.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN) {
        const found = defaultWidgetsMap[configItem.widgetId];

        return found
          ? { ...configItem, name: found.name, description: found.description }
          : { ...configItem, problem: true };
      }

      if ([NAMESPACE_EXTENSION, NAMESPACE_APP].includes(configItem.widgetNamespace)) {
        const found = widgets.find(
          (e) =>
            e.widgetNamespace === configItem.widgetNamespace && e.widgetId === configItem.widgetId
        );

        // Settings have to be copied to the widget for
        // the updating of instance parameters to work
        const widget = found
          ? { ...found, ...pick(configItem, ['settings']) }
          : // Mark as problem true if the widget wasn't found in the list of valid widgets
            { ...configItem, problem: true };

        return widget;
      }

      return null;
    })
    .filter(identity);

  const availableItems = [];
  const validWidgetMatcher = (widget) => (item) =>
    item.widgetNamespace === widget.widgetNamespace &&
    item.widgetId === widget.widgetId &&
    item.problem !== true;

  // Add all disabled and missing built-in widgets to the list
  // of available items.
  initialItems.forEach((buildInWidget) => {
    const found = items.find(validWidgetMatcher(buildInWidget));

    if (!found || found.disabled === true) {
      availableItems.push(buildInWidget);
    }
  });

  // Add all custom widgets that are not selected to the list
  // of available items.
  widgets.forEach((widget) => {
    const found = items.find(validWidgetMatcher(widget));

    if (!found && canBeUsedInSidebar(widget)) {
      availableItems.push(widget);
    }
  });

  items = items
    .filter((widget) => widget.disabled !== true)
    .filter((widget) => {
      // Filter out all items that are present in the list of available items.
      return !availableItems.find((item) => {
        return item.widgetNamespace === widget.widgetNamespace && item.widgetId === widget.widgetId;
      });
    });

  return {
    sidebarType: SidebarType.custom,
    items,
    availableItems,
    configurableWidget: null,
  };
}
