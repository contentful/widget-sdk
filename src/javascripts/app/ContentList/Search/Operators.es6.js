export const equality = ['', '=='];

export const inequality = ['ne', '!='];

export const fts = ['match', 'matches'];

export const ranges = [
  ['lt', '<'],
  ['lte', '<='],
  ['gt', '>'],
  ['gte', '>=']
];

export const arrays = [
  equality,
  inequality,
  ['all', 'matches'],
  ['in', 'includes'],
  ['nin', 'doesn\'t include']
];

export function getOperatorsForType (type) {
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
    case 'Boolean':
      return [equality];
    case 'Link':
      return [equality, inequality];
    case 'Array':
      return arrays;
    default:
      return [equality, inequality];
  }
  /* eslint-enable no-restricted-syntax */
}
