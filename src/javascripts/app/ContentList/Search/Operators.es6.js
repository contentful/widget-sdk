export const Operator = {
  EQUALS: '',
  NOT_EQUALS: 'ne',
  MATCH: 'match',
  LT: 'lt',
  LTE: 'lte',
  GT: 'gt',
  GTE: 'gte'
};

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

export function getOperatorsByType (type) {
  /* eslint-disable no-restricted-syntax */
  switch (type) {
    case 'Symbol':
      return [equality, inequality, fts];
    case 'Text':
      return [fts];
    case 'Date':
      return [equality, ...ranges];
    case 'Integer':
    case 'Number':
      return [equality, inequality, ...ranges];
    case 'User':
    case 'Array':
    case 'Boolean':
      return [equality];
    case 'SymbolList':
    case 'SymbolPredefined':
    case 'SymbolListPredefined':
    case 'Link':
      return [equality, inequality];
    default:
      return [equality, inequality];
  }
  /* eslint-enable no-restricted-syntax */
}
