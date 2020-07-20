import { WidgetNamespace } from './interfaces';

export const isCustomWidget = (ns: WidgetNamespace) =>
  [WidgetNamespace.EXTENSION, WidgetNamespace.APP].includes(ns);
