import { TYPES } from '../Util.es6';

let linkCount = 0;

export function newLink(id = null, type = TYPES.ENTRY) {
  return {
    sys: {
      id: id || `UNIQUE_${type.toUpperCase()}_ID_${++linkCount}`,
      type: 'Link',
      linkType: type
    }
  };
}

export function newAssetLink(id) {
  return newLink(id, TYPES.ASSET);
}
