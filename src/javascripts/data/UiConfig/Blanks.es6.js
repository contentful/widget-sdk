import { assign } from 'utils/Collections.es6';

import * as random from 'utils/Random.es6';
import { getModule } from 'NgRegistry.es6';

const systemFields = getModule('systemFields');

export function getBlankEntryView() {
  return {
    id: random.id(),
    title: 'New view',
    searchText: '',
    searchFilters: [],
    contentTypeId: null,
    contentTypeHidden: false,
    order: systemFields.getDefaultOrder(),
    displayedFieldIds: systemFields.getDefaultFieldIds()
  };
}

export function getBlankAssetView() {
  return {
    id: random.id(),
    title: 'New view',
    searchTerm: null
  };
}

export function makeBlankFolder(overrides) {
  return assign(
    {
      id: random.id(),
      title: 'New folder',
      views: []
    },
    overrides
  );
}
