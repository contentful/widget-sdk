import { WidgetLocation } from '@contentful/widget-renderer';

/**
 * [label, internalFieldType]
 */
export const FIELD_TYPES_ORDER: [string, string][] = [
  ['Short text', 'Symbol'],
  ['Number, decimal', 'Number'],
  ['Entry reference', 'Entry'],
  ['Short text, list', 'Symbols'],
  ['Date and time', 'Date'],
  ['Entry reference, list', 'Entries'],
  ['Long text', 'Text'],
  ['Location', 'Location'],
  ['Media reference', 'Asset'],
  ['Rich text', 'RichText'],
  ['Boolean', 'Boolean'],
  ['Media reference, list', 'Assets'],
  ['Number, integer', 'Integer'],
  ['JSON object', 'Object'],
];

/**
 * [name, location]
 */
export const LOCATION_ORDER: [string, string][] = [
  ['App configuration screen', WidgetLocation.APP_CONFIG],
  ['Entry field', WidgetLocation.ENTRY_FIELD],
  ['Entry sidebar', WidgetLocation.ENTRY_SIDEBAR],
  ['Entry editor', WidgetLocation.ENTRY_EDITOR],
  ['Page', WidgetLocation.PAGE],
  ['Dialog', WidgetLocation.DIALOG],
];
