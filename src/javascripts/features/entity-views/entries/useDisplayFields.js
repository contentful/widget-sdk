import { useState, useEffect } from 'react';
import { sortBy, pick } from 'lodash';
import * as SystemFields from 'data/SystemFields';
import * as MetadataFields from 'data/MetadataFields';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

export const getAvailableDisplayFields = (contentTypes, contentTypeId) => {
  const filteredContentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
  let fields = [...SystemFields.getList(), ...MetadataFields.getList()];

  if (filteredContentType) {
    fields = [...fields, ...filteredContentType.fields].filter(
      ({ disabled, id }) => !disabled && id !== filteredContentType.displayField
    );
  }
  return fields;
};

const VIEW_KEYS = ['displayedFieldIds', 'contentTypeId'];

export const useDisplayFields = ({ listViewContext, updateEntities }) => {
  const [hiddenFields, setHiddenFields] = useState([]);
  const [displayedFields, setDisplayedFields] = useState([]);
  const { currentSpaceContentTypes: contentTypes } = useSpaceEnvContext();

  const view = listViewContext.getView();
  const { displayedFieldIds, contentTypeId } = view;
  const readViewKeys = () => pick(view, VIEW_KEYS);

  const refreshDisplayFields = ({ displayedFieldIds = [], contentTypeId }) => {
    const fields = getAvailableDisplayFields(contentTypes, contentTypeId);

    const displayedFields = displayedFieldIds
      .map((id) => fields.find((field) => field.id === id))
      .filter(Boolean);
    const hiddenFields = fields.filter(({ id }) => !displayedFieldIds.includes(id));
    setHiddenFields(sortBy(hiddenFields, 'name'));
    setDisplayedFields(displayedFields);
    listViewContext.assignView({ displayedFieldIds: displayedFields.map(({ id }) => id) });
  };

  useEffect(() => {
    refreshDisplayFields(readViewKeys());
  }, [contentTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addDisplayField = (field) => {
    refreshDisplayFields({
      ...readViewKeys(),
      displayedFieldIds: [...displayedFieldIds, field.id],
    });
    if (field.type === 'Link') {
      // Refresh entity caches to display referenced entities
      updateEntities();
    }
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
