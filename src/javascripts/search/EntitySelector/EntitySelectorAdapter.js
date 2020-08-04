import React from 'react';
import PropTypes from 'prop-types';
import { Search, useListView } from 'features/entity-search';

const EntitySelectorAdapter = (props) => {
  const listViewContext = useListView({
    entityType: props.entityType,
    initialState: props.initialState,
    isPersisted: false,
  });
  const onUpdate = () => props.onUpdate(listViewContext.getView());
  return <Search {...props} onUpdate={onUpdate} listViewContext={listViewContext} />;
};

EntitySelectorAdapter.propTypes = {
  entityType: PropTypes.oneOf(['asset', 'entry']).isRequired,
  initialState: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  getContentTypes: PropTypes.func.isRequired,
  users: PropTypes.array.isRequired,
};

export default EntitySelectorAdapter;
