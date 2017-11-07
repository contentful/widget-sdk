export const equality = ['', 'is'];

export const inequality = ['ne', 'is not'];

export const fts = ['match', 'matches'];

export const ranges = [
  ['lt', 'is less than'],
  ['lte', 'is less than or equal to'],
  ['gt', 'is greater than'],
  ['gte', 'is greater than or equal to']
];

export function getOperatorsByType (type) {
  /* eslint-disable no-restricted-syntax */
  switch (type) {
    case 'Symbol':
      return [equality, inequality, fts];
    case 'Text':
      return [fts];
    case 'Date':
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
