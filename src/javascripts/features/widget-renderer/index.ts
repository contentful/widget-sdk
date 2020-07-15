import { WidgetNamespace } from './interfaces';

export { WidgetLoader } from './WidgetLoader';
export { MarketplaceDataProvider } from './MarketplaceDataProvider';
export { WidgetNamespace, HostingType, WidgetLocation } from './interfaces';
export type { Widget } from './interfaces';
export { buildAppDefinitionWidget } from './buildWidgets';

export const isCustomWidget = (ns: WidgetNamespace) =>
  [WidgetNamespace.EXTENSION, WidgetNamespace.APP].includes(ns);
