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
];

export const ACCEPTED_ENTRY_FILES = ['index.html'];

export const SRC_REG_EXP = /(^https:\/\/)|(^http:\/\/localhost(:[0-9]+)?(\/|$))/;
export const PARAMETER_ID_REG_EXP = /^[a-zA-Z][a-zA-Z0-9_]*$/;
export const EMPTY_SPACE_REG_EXP = /\s/;
export const ABSOLUTE_PATH_REG_EXP = /(src|href)="\/([^/])([^"]*)+"/g;

export const PARAMETER_TYPE_LABEL = {
  Symbol: 'Short text',
  Boolean: 'Boolean',
  Number: 'Number',
  Enum: 'Select',
};

export const UI_BUNDLE_ERRORS = {
  EMPTY: 'You tried to upload an empty folder',
  UNKNOWN: 'Something went wrong while uploading your bundle. Please try again.',
  ENTRY_FILE: 'Make sure your bundle includes a valid index.html file in its root folder.',
};
