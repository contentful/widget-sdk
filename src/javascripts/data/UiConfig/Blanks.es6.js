import {assign} from 'utils/Collections';

import random from 'random';
import systemFields from 'systemFields';

export function getBlankEntryView () {
  return {
    id: random.id(),
    title: 'New view',
    searchTerm: null,
    contentTypeId: null,
    contentTypeHidden: false,
    order: systemFields.getDefaultOrder(),
    displayedFieldIds: systemFields.getDefaultFieldIds()
  };
}

export function getBlankAssetView () {
  return {
    id: random.id(),
    title: 'New view',
    searchTerm: null
  };
}

export function makeBlankFolder (overrides) {
  return assign({
    id: random.id(),
    title: 'New folder',
    views: []
  }, overrides);
}
