import { useState, useEffect } from 'react';
import { sortBy, pick } from 'lodash';
import { getModule } from 'core/NgRegistry';
import * as SystemFields from 'data/SystemFields';
import * as MetadataFields from 'data/MetadataFields';

const getAvailableFields = (contentTypeId) => {
  const spaceContext = getModule('spaceContext');
  const filteredContentType = spaceContext.publishedCTs.get(contentTypeId);
  let fields = [...SystemFields.getList(), ...MetadataFields.getList()];

  if (filteredContentType) {
    fields = [...fields, ...filteredContentType.data.fields].filter(
      ({ disabled, id }) => !disabled && id !== filteredContentType.data.displayField
    );
  }
  return fields;
};

const VIEW_KEYS = ['displayedFieldIds', 'contentTypeId'];

export const useDisplayFields = ({ listViewContext, updateEntities }) => {
  const [hiddenFields, setHiddenFields] = useState([]);
  const [displayedFields, setDisplayedFields] = useState([]);

  const view = listViewContext.getView();
  const { contentTypeId, displayedFieldIds } = view;
  const readViewKeys = () => pick(view, VIEW_KEYS);

  const refreshDisplayFields = ({ displayedFieldIds = [], contentTypeId }) => {
    const fields = getAvailableFields(contentTypeId);

    const displayedFields = displayedFieldIds
      .map((id) => fields.find((field) => field.id === id))
      .filter(Boolean);
    const hiddenFields = fields.filter(({ id }) => !displayedFieldIds.includes(id));
    setHiddenFields(sortBy(hiddenFields, 'name'));
    setDisplayedFields(displayedFields);
    listViewContext.assignView({ displayedFieldIds: displayedFields.map(({ id }) => id) });
    updateEntities();
  };

  useEffect(() => {
    refreshDisplayFields(readViewKeys());
  }, [contentTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addDisplayField = (field) => {
    refreshDisplayFields({
      ...readViewKeys(),
      displayedFieldIds: [...displayedFieldIds, field.id],
    });
  };

  const removeDisplayField = (field) => {
    refreshDisplayFields({
      ...readViewKeys(),
      displayedFieldIds: displayedFieldIds.filter((id) => id !== field.id),
    });
  };

  const updateFieldOrder = (fields) => {
    listViewContext.assignView({ displayedFieldIds: fields.map(({ id }) => id) });
    setDisplayedFields(fields);
  };

  return [
    { displayedFields, hiddenFields },
    { addDisplayField, removeDisplayField, updateFieldOrder },
  ];
};
