import { pick, difference, identity } from 'lodash';

import { defaultWidgetsMap } from '../defaults';

import { WidgetNamespace, isCustomWidget, WidgetLocation } from 'features/widget-renderer';

/**
 * Converts internal state of configuration reducer
 * to data that can be used in API calls to `/editor_inteface`
 * for saving configuration.
 */
export function convertInternalStateToConfiguration(state: any, initialItems: any) {
  if (state.items === initialItems) {
    return undefined;
  }

  const selectedDefaultIds = state.items
    .filter((widget: any) => widget.widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN)
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

function convertToWidgetConfiguration(widget: any) {
  return {
    widgetId: widget.id,
    widgetNamespace: widget.namespace,
    ...pick(widget, ['name', 'locations', 'parameters']),
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
  configuration: any,
  widgets: any,
  initialItems: any
) {
  if (!Array.isArray(configuration)) {
    return {
      items: initialItems,
      availableItems: widgets.filter(canBeUsedInSidebar).map(convertToWidgetConfiguration),
      configurableWidget: null,
    };
  }

  widgets = widgets.map(convertToWidgetConfiguration);

  // Mark unavailable widgets with `problem: true`.
  let items = configuration
    .map((configItem) => {
      if (configItem.widgetNamespace === WidgetNamespace.SIDEBAR_BUILTIN) {
        const found = defaultWidgetsMap[configItem.widgetId];

        return found
          ? { ...configItem, name: found.name, description: found.description }
          : { ...configItem, problem: true };
      }

      if (isCustomWidget(configItem.widgetNamespace)) {
        const found = widgets.find(
          (e: any) =>
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

  const availableItems: any[] = [];
  const validWidgetMatcher = (widget: any) => (item: any) =>
    item.widgetNamespace === widget.widgetNamespace &&
    item.widgetId === widget.widgetId &&
    item.problem !== true;

  // Add all disabled and missing built-in widgets to the list
  // of available items.
  initialItems.forEach((buildInWidget: any) => {
    const found = items.find(validWidgetMatcher(buildInWidget));

    if (!found || found.disabled === true) {
      availableItems.push(buildInWidget);
    }
  });

  // Add all custom widgets that are not selected to the list
  // of available items.
  widgets.forEach((widget: any) => {
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
    items,
    availableItems,
    configurableWidget: null,
  };
}
