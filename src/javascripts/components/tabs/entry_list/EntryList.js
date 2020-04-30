import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { onEntryEvent } from './eventTracker';

import EntityList from '../EntityList';
import ViewCustomizer from './ViewCustomizer';
import DisplayField from './DisplayField';
import createViewPersistor from 'data/ListViewPersistor';
import { useDisplayFields } from './useDisplayFields';
import { useOrderedColumns } from './useOrderedColumns';

export default function EntryList({
  isSearching,
  displayFieldForFilteredContentType,
  entries = [],
  entryCache,
  assetCache,
  updateEntries,
  jobs = [],
}) {
  const entityType = 'entry';
  const viewPersistor = useMemo(() => createViewPersistor({ entityType }), [entityType]);
  const [{ displayedFields, hiddenFields }, displayFieldsActions] = useDisplayFields({
    viewPersistor,
    updateEntities: updateEntries,
  });
  const [{ fieldIsSortable, isOrderField, orderColumnBy }] = useOrderedColumns({
    viewPersistor,
    updateEntities: updateEntries,
  });
  const { contentTypeId, order = {} } = viewPersistor.readKeys(['contentTypeId', 'order']);

  const hasContentTypeSelected = !!contentTypeId;

  // can be undefined
  const displayFieldName = displayFieldForFilteredContentType() || {};
  const nameField = {
    ...displayFieldName,
    id: 'name',
    name: 'Name',
    isSortable: hasContentTypeSelected && fieldIsSortable(displayFieldName),
    isActiveSort: displayFieldName && isOrderField(displayFieldName),
    onClick: () => orderColumnBy(displayFieldName),
    direction: order.direction,
    type: 'EntryTitle',
    colWidth: '20%',
  };

  const enrichedDisplayedFields = [
    nameField,
    ...displayedFields.map((field) => ({
      ...field,
      isSortable: fieldIsSortable(field),
      isActiveSort: isOrderField(field),
      onClick: () => orderColumnBy(field),
      direction: order.direction,
    })),
  ];

  return (
    <EntityList
      displayedFields={enrichedDisplayedFields}
      entities={entries}
      entityType={entityType}
      jobs={jobs}
      onBulkActionComplete={onEntryEvent}
      updateEntities={updateEntries}
      isLoading={isSearching}
      renderDisplayField={(props) => (
        <DisplayField entryCache={entryCache} assetCache={assetCache} {...props} />
      )}
      renderViewCustomizer={(props = {}) => {
        return (
          <ViewCustomizer
            displayedFields={displayedFields}
            hiddenFields={hiddenFields}
            {...displayFieldsActions}
            {...props}
          />
        );
      }}
    />
  );
}

EntryList.propTypes = {
  isSearching: PropTypes.bool,
  displayFieldForFilteredContentType: PropTypes.func.isRequired,
  entries: PropTypes.array,
  updateEntries: PropTypes.func.isRequired,
  entryCache: PropTypes.object,
  assetCache: PropTypes.object,
  jobs: PropTypes.array,
};
