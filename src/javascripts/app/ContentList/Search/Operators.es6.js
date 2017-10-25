export const equality = ['', '=='];

export const inequality = ['ne', '!='];

export const fts = ['match', 'matches'];

export const ranges = [
  ['lt', '<'],
  ['lte', '<='],
  ['gt', '>'],
  ['gte', '>=']
];

export function getOperatorsForType (type) {
  switch (type) {
    case 'Symbol':
      return [equality, inequality, fts];
    case 'Text':
      return [fts];
    case 'Date':
    case 'Integer':
    case 'Number':
      return [equality, inequality, ...ranges];
    default:
      return [equality, inequality];
  }
}
