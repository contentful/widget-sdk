import { EntryConfiguration, defaultWidgetsMap } from '../defaults.es6';
import { difference, isArray } from 'lodash';
import { SidebarType } from '../constants.es6';
import { NAMESPACE_SIDEBAR_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

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
    .filter(widget => widget.invalid !== true)
    .map(widget => ({
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

function convertExtensionToWidgetConfiguration(extension) {
  return {
    widgetId: extension.id,
    widgetNamespace: NAMESPACE_EXTENSION,
    title: extension.name
  };
}

export function convertConfigirationToInternalState(configuration, extensions) {
  if (!isArray(configuration)) {
    return {
      sidebarType: SidebarType.default,
      items: EntryConfiguration,
      availableItems: extensions.map(convertExtensionToWidgetConfiguration)
    };
  }

  const installedExtensions = extensions.map(convertExtensionToWidgetConfiguration);
  const installedExtensionsMap = installedExtensions.reduce((acc, value) => {
    return {
      ...acc,
      [value.widgetId]: value
    };
  }, {});

  // mark invalid all items that are not available
  let items = configuration
    .map(widget => {
      if (widget.widgetNamespace === NAMESPACE_SIDEBAR_BUILTIN) {
        return defaultWidgetsMap[widget.widgetId]
          ? {
              ...widget,
              title: defaultWidgetsMap[widget.widgetId].title,
              description: defaultWidgetsMap[widget.widgetId].description
            }
          : {
              ...widget,
              invalid: true
            };
      }
      if (widget.widgetNamespace === NAMESPACE_EXTENSION) {
        return installedExtensionsMap[widget.widgetId]
          ? {
              ...widget,
              title: installedExtensionsMap[widget.widgetId].title
            }
          : {
              ...widget,
              invalid: true
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
        widget.invalid !== true
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
        widget.invalid !== true
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
    availableItems
  };
}
