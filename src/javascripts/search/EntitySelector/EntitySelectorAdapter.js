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
  return <Search {...props} listViewContext={listViewContext} />;
};

EntitySelectorAdapter.propTypes = {
  entityType: PropTypes.oneOf(['asset', 'entry']).isRequired,
  initialState: PropTypes.object,
};

export default EntitySelectorAdapter;
