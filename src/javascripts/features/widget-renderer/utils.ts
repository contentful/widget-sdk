import { WidgetNamespace, WidgetLocation } from './interfaces';

export const isCustomWidget = (ns: WidgetNamespace) =>
  [WidgetNamespace.EXTENSION, WidgetNamespace.APP].includes(ns);

export const isFieldEditingLocation = (l: WidgetLocation) =>
  [WidgetLocation.ENTRY_FIELD, WidgetLocation.ENTRY_FIELD_SIDEBAR].includes(l);

export const isEntryEditingLocation = (l: WidgetLocation) =>
  [
    WidgetLocation.ENTRY_FIELD,
    WidgetLocation.ENTRY_FIELD_SIDEBAR,
    WidgetLocation.ENTRY_SIDEBAR,
    WidgetLocation.ENTRY_EDITOR,
  ].includes(l);
