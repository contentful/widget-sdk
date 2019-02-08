import { EntryConfiguration, defaultWidgetsMap } from '../defaults.es6';
import { difference, isArray } from 'lodash';
import { SidebarType } from '../constants.es6';
import { NAMESPACE_SIDEBAR_BUILTIN } from 'widgets/WidgetNamespaces.es6';

export function convertInternalStateToConfiguration(state) {
  if (state.sidebarType === SidebarType.default) {
    return undefined;
  }

  const selectedDefaultIds = state.items
    .filter(widget => widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN)
    .map(widget => widget.widgetId);
  const defaultIds = EntryConfiguration.map(widget => widget.widgetId);
  const missingBuiltinIds = difference(defaultIds, selectedDefaultIds);

  const selectedItems = state.items.map(widget => ({
    widgetId: widget.widgetId,
    widgetNamespace: widget.widgetNamespace
  }));

  const missingItems = EntryConfiguration.filter(widget =>
    missingBuiltinIds.includes(widget.widgetId)
  ).map(widget => ({
    widgetId: widget.widgetId,
    widgetNamespace: widget.widgetNamespace,
    disabled: true
  }));

  return [...selectedItems, ...missingItems];
}

export function convertConfigirationToInternalState(configuration) {
  if (!isArray(configuration)) {
    return {
      sidebarType: SidebarType.default,
      items: EntryConfiguration,
      availableItems: []
    };
  }

  const defaultIds = EntryConfiguration.map(widget => widget.widgetId);

  // filter out all invalid builtin items
  const validItems = configuration.filter(widget => {
    if (widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN) {
      return defaultIds.includes(widget.widgetId);
    }
    return true;
  });

  const availableItems = [];

  // add all disabled buildin items to available items
  validItems
    .filter(
      widget => widget.disabled === true && widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN
    )
    .map(widget => widget.widgetId)
    .forEach(disabledId => {
      const widget = defaultWidgetsMap[disabledId];
      if (widget) {
        availableItems.push(widget);
      }
    });

  // add to available all buildin items that are not present in configuration
  difference(
    defaultIds,
    validItems
      .filter(widget => widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN)
      .map(widget => widget.widgetId)
  ).forEach(missingWidgetId => {
    const widget = defaultWidgetsMap[missingWidgetId];
    if (widget) {
      availableItems.push(widget);
    }
  });

  const availableItemsIds = availableItems.map(widget => widget.widgetId);
  const items = validItems
    .filter(widget => !availableItemsIds.includes(widget.widgetId))
    .map(widget => {
      if (widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN) {
        return defaultWidgetsMap[widget.widgetId];
      }
      return widget;
    });

  return {
    sidebarType: SidebarType.custom,
    items,
    availableItems
  };
}
