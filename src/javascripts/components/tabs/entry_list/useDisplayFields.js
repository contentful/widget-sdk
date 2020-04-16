import { useState, useEffect } from 'react';
import { sortBy } from 'lodash';
import { getModule } from 'NgRegistry';
import * as SystemFields from 'data/SystemFields';

const getAvailableFields = (contentTypeId) => {
  const spaceContext = getModule('spaceContext');
  const filteredContentType = spaceContext.publishedCTs.get(contentTypeId);
  let fields = SystemFields.getList();

  if (filteredContentType) {
    fields = [...fields, ...filteredContentType.data.fields].filter(
      ({ disabled, id }) => !disabled && id !== filteredContentType.data.displayField
    );
  }
  return fields;
};

const VIEW_KEYS = ['displayedFieldIds', 'contentTypeId'];
export const useDisplayFields = ({ viewPersistor, updateEntities }) => {
  const [hiddenFields, setHiddenFields] = useState([]);
  const [displayedFields, setDisplayedFields] = useState([]);

  const contentTypeId = viewPersistor.readKey('contentTypeId');

  const refreshDisplayFields = ({ displayedFieldIds = [], contentTypeId }) => {
    const fields = getAvailableFields(contentTypeId);
    const displayedFields = displayedFieldIds
      .map((id) => fields.find((field) => field.id === id))
      .filter(Boolean);
    const hiddenFields = fields.filter(({ id }) => !displayedFieldIds.includes(id));
    setHiddenFields(sortBy(hiddenFields, 'name'));
    setDisplayedFields(displayedFields);
    viewPersistor.saveKey(
      'displayedFieldIds',
      displayedFields.map(({ id }) => id)
    );
    updateEntities();
  };

  useEffect(() => {
    const view = viewPersistor.readKeys(VIEW_KEYS);
    refreshDisplayFields(view);
  }, [contentTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addDisplayField = (field) => {
    const view = viewPersistor.readKeys(VIEW_KEYS);
    refreshDisplayFields({
      ...view,
      displayedFieldIds: [...view.displayedFieldIds, field.id],
    });
  };

  const removeDisplayField = (field) => {
    const view = viewPersistor.readKeys(VIEW_KEYS);
    refreshDisplayFields({
      ...view,
      displayedFieldIds: view.displayedFieldIds.filter((id) => id !== field.id),
    });
  };

  const updateFieldOrder = (fields) => {
    viewPersistor.saveKey(
      'displayedFieldIds',
      fields.map(({ id }) => id)
    );
    setDisplayedFields(fields);
    updateEntities();
  };

  return [
    { displayedFields, hiddenFields },
    { addDisplayField, removeDisplayField, updateFieldOrder },
  ];
};
