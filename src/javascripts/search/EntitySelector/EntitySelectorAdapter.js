import React from 'react';
import PropTypes from 'prop-types';
import useListView from 'app/ContentList/Search/useListView';
import Search from 'app/ContentList/Search/View';

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
};

export default EntitySelectorAdapter;