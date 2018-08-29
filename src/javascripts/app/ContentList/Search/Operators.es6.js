import { values } from 'lodash';

/**
 * Enum of filter operators.
 * @readonly
 * @enum {string}
 */
export const Operator = {
  EQUALS: '',
  NOT_EQUALS: 'ne',
  EXISTS: 'exists',
  MATCH: 'match',
  LT: 'lt',
  LTE: 'lte',
  GT: 'gt',
  GTE: 'gte'
};

/**
 * Checks if operator has a valid Operator enum value.
 * @param {string} operator
 */
export const isValid = operator => values(Operator).indexOf(operator) > -1;

// TODO: decouple operators from labels
export const equality = [Operator.EQUALS, 'is'];

export const inequality = [Operator.NOT_EQUALS, 'is not'];

export const fts = [Operator.MATCH, 'matches'];

export const ranges = [
  [Operator.LT, 'is less than'],
  [Operator.LTE, 'is less than or equal to'],
  [Operator.GT, 'is greater than'],
  [Operator.GTE, 'is greater than or equal to']
];

export function getOperatorsByType(type) {
  /* eslint-disable no-restricted-syntax */
  switch (type) {
    case 'Symbol':
      return [equality, inequality, fts];
    case 'StructuredText':
    case 'AssetField':
    case 'Text':
      return [fts];
    case 'AssetDetailsSize':
    case 'Date':
      return [equality, ...ranges];
    case 'Integer':
    case 'Number':
      return [equality, inequality, ...ranges];
    case 'AssetFileField':
    case 'AssetType':
    case 'User':
    case 'Array':
    case 'Boolean':
      return [equality];
    case 'SymbolList':
    case 'SymbolPredefined':
    case 'SymbolListPredefined':
    case 'Link':
      return [equality, inequality];
    case 'AssetDetails':
      return [equality, ...ranges];
    default:
      return [equality, inequality];
  }
  /* eslint-enable no-restricted-syntax */
}
