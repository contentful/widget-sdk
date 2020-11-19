import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { onEntryEvent } from './eventTracker';
import { EntityList } from '../core/EntityList';
import { ViewCustomizer } from './ViewCustomizer';
import { DisplayField, DisplayFieldWithTagsEnabled } from './DisplayField';
import { useDisplayFields } from './useDisplayFields';
import { useOrderedColumns } from './useOrderedColumns';
import { useTagsFeatureEnabled } from 'features/content-tags';
import { METADATA_TAGS_ID } from 'data/MetadataFields';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';

export function EntryList({
  isLoading,
  entries = [],
  searchControllerProps,
  listViewContext,
  updateEntries,
  jobs = [],
  pageIndex = 0,
}) {
  const entityType = 'entry';
  const [{ displayedFields, hiddenFields }, displayFieldsActions] = useDisplayFields({
    listViewContext,
    updateEntities: updateEntries,
  });
  const [{ fieldIsSortable, isOrderField, orderColumnBy }] = useOrderedColumns({
    listViewContext,
    updateEntities: updateEntries,
  });
  const { contentTypeId, order } = listViewContext.getView();

  const hasContentTypeSelected = !!contentTypeId;

  const { tagsEnabled } = useTagsFeatureEnabled();

  const fieldsWithoutTags = useCallback(
    (fields) => fields.filter((field) => field.id !== METADATA_TAGS_ID),
    []
  );

  const filteredDisplayFields = useMemo(() => {
    return tagsEnabled ? displayedFields : fieldsWithoutTags(displayedFields);
  }, [tagsEnabled, displayedFields, fieldsWithoutTags]);

  const filteredHiddenFields = useMemo(() => {
    return tagsEnabled ? hiddenFields : fieldsWithoutTags(hiddenFields);
  }, [tagsEnabled, hiddenFields, fieldsWithoutTags]);

  // can be undefined
  const displayFieldName = EntityFieldValueSpaceContext.displayFieldForType(contentTypeId) || {};
  const nameField = {
    ...displayFieldName,
    id: 'name',
    name: 'Name',
    isSortable: hasContentTypeSelected && fieldIsSortable(displayFieldName),
    isActiveSort: displayFieldName && isOrderField(displayFieldName),
    onClick: () => orderColumnBy(displayFieldName),
    direction: order?.direction,
    type: 'EntryTitle',
    colWidth: '20%',
  };

  const enrichedDisplayedFields = [
    nameField,
    ...filteredDisplayFields.map((field) => ({
      ...field,
      isSortable: fieldIsSortable(field),
      isActiveSort: isOrderField(field),
      onClick: () => orderColumnBy(field),
      direction: order?.direction,
    })),
  ];

  const { asset: assetCache, entry: entryCache } = searchControllerProps.cache;

  return (
    <EntityList
      displayedFields={enrichedDisplayedFields}
      entities={entries}
      entityType={entityType}
      jobs={jobs}
      onBulkActionComplete={onEntryEvent}
      updateEntities={updateEntries}
      isLoading={isLoading}
      pageIndex={pageIndex}
      renderDisplayField={(props) => {
        if (props.tagsEnabled) {
          return (
            <DisplayFieldWithTagsEnabled
              entryCache={entryCache}
              assetCache={assetCache}
              {...props}
            />
          );
        } else {
          return <DisplayField entryCache={entryCache} assetCache={assetCache} {...props} />;
        }
      }}
      renderViewCustomizer={(props = {}) => {
        return (
          <ViewCustomizer
            displayedFields={filteredDisplayFields}
            hiddenFields={filteredHiddenFields}
            {...displayFieldsActions}
            {...props}
          />
        );
      }}
    />
  );
}

EntryList.propTypes = {
  isLoading: PropTypes.bool,
  entries: PropTypes.array,
  updateEntries: PropTypes.func.isRequired,
  searchControllerProps: PropTypes.shape({
    cache: PropTypes.shape({
      entry: PropTypes.object.isRequired,
      asset: PropTypes.object.isRequired,
    }).isRequired,
  }).isRequired,
  assetCache: PropTypes.object,
  jobs: PropTypes.array,
  pageIndex: PropTypes.number,
  tagsEnabled: PropTypes.bool,
  listViewContext: PropTypes.shape({
    getView: PropTypes.func.isRequired,
  }).isRequired,
};
