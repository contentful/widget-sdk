export const equality = ['', '=='];

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
      return [equality, fts];
    case 'Date':
    case 'Integer':
    case 'Number':
      return [equality, ...ranges];
    default:
      return [equality];
  }
}
