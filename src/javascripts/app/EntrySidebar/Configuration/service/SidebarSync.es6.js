import { EntryConfiguration, defaultWidgetsMap } from '../defaults.es6';
import { difference, isArray } from 'lodash';
import { SidebarType } from '../constants.es6';
import { NAMESPACE_SIDEBAR_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

/**
 * Converts internal state for configuration reducer
 * to data that can be used in API call for saving configuration
 */
export function convertInternalStateToConfiguration(state) {
  if (state.sidebarType === SidebarType.default) {
    return undefined;
  }

  const selectedDefaultIds = state.items
    .filter(widget => widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN)
    .map(widget => widget.widgetId);
  const defaultIds = EntryConfiguration.map(widget => widget.widgetId);
  const missingBuiltinIds = difference(defaultIds, selectedDefaultIds);

  const selectedItems = state.items
    .filter(widget => widget.problem !== true)
    .map(widget => ({
      widgetId: widget.widgetId,
      widgetNamespace: widget.widgetNamespace,
      settings: widget.settings || {}
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

function convertExtensionToWidgetConfiguration(extension) {
  return {
    widgetId: extension.id,
    widgetNamespace: NAMESPACE_EXTENSION,
    name: extension.name,
    parameters: extension.parameters || []
  };
}

/**
 * Converts saved configuration state and list of available extensions
 * to initial state of configuration reducer, enriches save configuration
 * with additional data needed to render UI
 */
export function convertConfigirationToInternalState(configuration, extensions) {
  if (!isArray(configuration)) {
    return {
      sidebarType: SidebarType.default,
      items: EntryConfiguration,
      availableItems: extensions.map(convertExtensionToWidgetConfiguration),
      configurableWidget: null
    };
  }

  const installedExtensions = extensions.map(convertExtensionToWidgetConfiguration);
  const installedExtensionsMap = installedExtensions.reduce((acc, value) => {
    return {
      ...acc,
      [value.widgetId]: value
    };
  }, {});

  // mark all items as problem that are not available
  let items = configuration
    .map(widget => {
      if (widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN) {
        return defaultWidgetsMap[widget.widgetId]
          ? {
              ...widget,
              name: defaultWidgetsMap[widget.widgetId].name,
              description: defaultWidgetsMap[widget.widgetId].description
            }
          : {
              ...widget,
              problem: true
            };
      }
      if (widget.widgetNamespace === NAMESPACE_EXTENSION) {
        return installedExtensionsMap[widget.widgetId]
          ? {
              ...widget,
              name: installedExtensionsMap[widget.widgetId].name,
              parameters: installedExtensionsMap[widget.widgetId].parameters || []
            }
          : {
              ...widget,
              problem: true
            };
      }
      return null;
    })
    .filter(widget => widget !== null);

  const availableItems = [];

  // add all disabled and missing built-in items to available list
  EntryConfiguration.forEach(buildInWidget => {
    const foundWidget = items.find(widget => {
      return (
        widget.widgetId === buildInWidget.widgetId &&
        widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN &&
        widget.problem !== true
      );
    });
    if (!foundWidget || foundWidget.disabled === true) {
      availableItems.push(buildInWidget);
    }
  });

  // add all extensions that are not in items to available list
  installedExtensions.forEach(extensionWidget => {
    const foundWidget = items.find(widget => {
      return (
        widget.widgetId === extensionWidget.widgetId &&
        widget.widgetNamespace === NAMESPACE_EXTENSION &&
        widget.problem !== true
      );
    });

    if (!foundWidget) {
      availableItems.push(extensionWidget);
    }
  });

  // filter out all items that are present in available items list
  const availableItemsIds = availableItems.map(widget => widget.widgetId);
  items = items
    .filter(widget => widget.disabled !== true)
    .filter(widget => !availableItemsIds.includes(widget.widgetId));

  return {
    sidebarType: SidebarType.custom,
    items,
    availableItems,
    configurableWidget: null
  };
}
