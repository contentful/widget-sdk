import { AssetConfiguration, EntryConfiguration } from '../defaults.es6';
import { difference } from 'lodash';
import { SidebarType } from '../constants.es6';
import { NAMESPACE_SIDEBAR_BUILTIN } from 'widgets/WidgetNamespaces.es6';

export const getAssetConfiguration = () => {
  return Promise.resolve(AssetConfiguration);
};

export const getEntryConfiguration = async () => {
  return Promise.resolve(EntryConfiguration);
};

export function convertInternalStateToConfiguration(state) {
  if (state.sidebarType === SidebarType.default) {
    return null;
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

export function convertConfigirationToInternalState() {}
