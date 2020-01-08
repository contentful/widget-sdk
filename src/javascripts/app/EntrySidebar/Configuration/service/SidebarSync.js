import { defaultWidgetsMap } from '../defaults';
import { difference, identity } from 'lodash';
import { SidebarType } from '../constants';
import {
  NAMESPACE_SIDEBAR_BUILTIN,
  NAMESPACE_EXTENSION,
  NAMESPACE_APP
} from 'widgets/WidgetNamespaces';
import { LOCATION_ENTRY_SIDEBAR } from 'widgets/WidgetLocations';

/**
 * Converts internal state for configuration reducer
 * to data that can be used in API call for saving configuration
 */
export function convertInternalStateToConfiguration(state, initialItems) {
  if (state.sidebarType === SidebarType.default) {
    return undefined;
  }

  const selectedDefaultIds = state.items
    .filter(widget => widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN)
    .map(widget => widget.widgetId);
  const defaultIds = initialItems.map(widget => widget.widgetId);
  const missingBuiltinIds = difference(defaultIds, selectedDefaultIds);

  const selectedItems = state.items
    .filter(widget => widget.problem !== true)
    .map(widget => ({
      widgetId: widget.widgetId,
      widgetNamespace: widget.widgetNamespace,
      settings: widget.settings || {}
    }));

  const missingItems = initialItems
    .filter(widget => missingBuiltinIds.includes(widget.widgetId))
    .map(widget => ({
      widgetId: widget.widgetId,
      widgetNamespace: widget.widgetNamespace,
      disabled: true
    }));

  return [...selectedItems, ...missingItems];
}

function convertExtensionToWidgetConfiguration(extension) {
  return {
    widgetId: extension.id,
    widgetNamespace: extension.namespace,
    name: extension.name,
    parameters: extension.parameters || [],
    locations: extension.locations
  };
}

function isSidebarExtension(extension) {
  if (!Array.isArray(extension.locations)) {
    return true;
  }

  return extension.locations.includes(LOCATION_ENTRY_SIDEBAR);
}

/**
 * Converts saved configuration state and list of available extensions
 * to initial state of configuration reducer, enriches save configuration
 * with additional data needed to render UI
 */
export function convertConfigirationToInternalState(configuration, extensions, initialItems) {
  if (!Array.isArray(configuration)) {
    const availableExtensions = extensions.filter(isSidebarExtension);

    return {
      sidebarType: SidebarType.default,
      items: initialItems,
      availableItems: availableExtensions.map(convertExtensionToWidgetConfiguration),
      configurableWidget: null
    };
  }

  const installedExtensions = extensions.map(convertExtensionToWidgetConfiguration);

  // mark all items as problem that are not available
  let items = configuration
    .map(configItem => {
      if (configItem.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN) {
        const found = defaultWidgetsMap[configItem.widgetId];

        return found
          ? { ...configItem, name: found.name, description: found.description }
          : { ...configItem, problem: true };
      }

      if ([NAMESPACE_EXTENSION, NAMESPACE_APP].includes(configItem.widgetNamespace)) {
        const found = installedExtensions.find(e => {
          return (
            e.widgetNamespace === configItem.widgetNamespace && e.widgetId === configItem.widgetId
          );
        });

        return found || { ...configItem, problem: true };
      }

      return null;
    })
    .filter(identity);

  const availableItems = [];

  // add all disabled and missing built-in items to available list
  initialItems.forEach(buildInWidget => {
    const foundWidget = items.find(
      widget =>
        widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN &&
        widget.widgetId === buildInWidget.widgetId &&
        widget.problem !== true
    );

    if (!foundWidget || foundWidget.disabled === true) {
      availableItems.push(buildInWidget);
    }
  });

  // add all extensions that are not in items to available list
  installedExtensions.forEach(extensionWidget => {
    const foundWidget = items.find(
      widget =>
        [NAMESPACE_EXTENSION, NAMESPACE_APP].includes(widget.widgetNamespace) &&
        widget.widgetId === extensionWidget.widgetId &&
        widget.problem !== true
    );

    if (!foundWidget && isSidebarExtension(extensionWidget)) {
      availableItems.push(extensionWidget);
    }
  });

  items = items
    .filter(widget => widget.disabled !== true)
    .filter(widget => {
      // filter out all items that are present in available items list
      return !availableItems.find(item => {
        return item.widgetNamespace === widget.widgetNamespace && item.widgetId === widget.widgetId;
      });
    });

  return {
    sidebarType: SidebarType.custom,
    items,
    availableItems,
    configurableWidget: null
  };
}
