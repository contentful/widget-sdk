import React from 'react';
import PropTypes from 'prop-types';
import { onEntryEvent } from './eventTracker';

import EntityList from '../EntityList';
import ViewCustomizer from './ViewCustomizer';
import DisplayField from './DisplayField';

export default function EntryList({
  context,
  displayedFields = [],
  displayFieldForFilteredContentType,
  fieldIsSortable,
  isOrderField,
  orderColumnBy,
  hiddenFields,
  removeDisplayField,
  addDisplayField,
  toggleContentType,
  updateFieldOrder,
  entries = [],
  entryCache,
  assetCache,
  updateEntries,
  jobs = [],
}) {
  const hasContentTypeSelected = !!context.view.contentTypeId;

  // can be undefined
  const displayFieldName = displayFieldForFilteredContentType();

  const isContentTypeVisible = !hasContentTypeSelected && !context.view.contentTypeHidden;

  const nameField = {
    id: 'name',
    name: 'Name',
    isSortable: hasContentTypeSelected && displayFieldName && fieldIsSortable(displayFieldName),
    isActiveSort: displayFieldName && isOrderField(displayFieldName),
    onClick: () => {
      if (displayFieldName && fieldIsSortable(displayFieldName)) {
        orderColumnBy(displayFieldName);
      }
    },
    direction: context.view.order.direction,
    colSpan: 3,
    type: 'EntryTitle',
  };

  const enrichedDisplayedFields = [
    nameField,
    ...displayedFields.map((field) => ({
      ...field,
      isSortable: fieldIsSortable(field),
      isActiveSort: isOrderField(field),
      onClick: () => fieldIsSortable(field) && orderColumnBy(field),
      direction: context.view.order.direction,
      colSpan: 2,
    })),
  ];

  const contentTypeField = {
    id: 'contentType',
    isSortable: false,
    name: 'Content Type',
    type: 'ContentType',
    colSpan: 2,
  };
  if (isContentTypeVisible) {
    enrichedDisplayedFields.splice(1, 0, contentTypeField);
  } else {
    hiddenFields.push(contentTypeField);
  }

  return (
    <EntityList
      displayedFields={enrichedDisplayedFields}
      entities={entries}
      entityType="entry"
      jobs={jobs}
      onBulkActionComplete={onEntryEvent}
      updateEntities={updateEntries}
      statusColSpan={2}
      isLoading={context.isSearching}
      renderDisplayField={(props) => (
        <DisplayField entryCache={entryCache} assetCache={assetCache} {...props} />
      )}
      renderViewCustomizer={(props = {}) => (
        <ViewCustomizer
          displayedFields={enrichedDisplayedFields}
          hiddenFields={hiddenFields}
          removeDisplayField={removeDisplayField}
          addDisplayField={addDisplayField}
          toggleContentType={toggleContentType}
          isContentTypeHidden={!context.view.contentTypeId && context.view.contentTypeHidden}
          updateFieldOrder={updateFieldOrder}
          {...props}
        />
      )}
    />
  );
}

EntryList.propTypes = {
  context: PropTypes.object.isRequired,
  displayedFields: PropTypes.array.isRequired,
  displayFieldForFilteredContentType: PropTypes.func.isRequired,
  fieldIsSortable: PropTypes.func.isRequired,
  isOrderField: PropTypes.func.isRequired,
  orderColumnBy: PropTypes.func.isRequired,
  hiddenFields: PropTypes.array,
  removeDisplayField: PropTypes.func.isRequired,
  addDisplayField: PropTypes.func.isRequired,
  toggleContentType: PropTypes.func.isRequired,
  updateFieldOrder: PropTypes.func.isRequired,
  entries: PropTypes.array,
  updateEntries: PropTypes.func.isRequired,
  entryCache: PropTypes.object,
  assetCache: PropTypes.object,
  jobs: PropTypes.array,
};
