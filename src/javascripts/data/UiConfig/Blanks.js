import { assign } from 'utils/Collections';
import * as random from 'utils/Random';
import * as SystemFields from 'data/SystemFields';

export function getBlankEntryView() {
  return {
    id: random.id(),
    title: 'New view',
    searchText: '',
    searchFilters: [],
    contentTypeId: null,
    order: SystemFields.getDefaultOrder(),
    displayedFieldIds: SystemFields.getDefaultFieldIds(),
  };
}

export function getBlankAssetView() {
  return {
    id: random.id(),
    title: 'New view',
    searchTerm: null,
  };
}

export function makeBlankFolder(overrides) {
  return assign(
    {
      id: random.id(),
      title: 'New folder',
      views: [],
    },
    overrides
  );
}
