import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import WrappedEntityCard from 'app/widgets/shared/FetchedEntityCard/WrappedEntityCard';
import { getState, stateName } from 'data/CMA/EntityState';

// TODO: Pass onClick from entitySelectorController here as a prop

const EntryLink = ({ entry, entityHelpers, getContentType, isSelected, size }) => {
  const state = entry ? getState(entry.sys) : undefined;
  const entityStatus = state ? stateName(state) : undefined;
  const [{ title, description, contentTypeName }, setEntityInfo] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntityInfo = async () => {
      if (entry) {
        let contentType;
        if (getContentType) {
          contentType = await getContentType(entry);
        }
        const title = await entityHelpers.entityTitle(entry);
        const description = await entityHelpers.entityDescription(entry);
        setEntityInfo({ title, description, contentTypeName: get(contentType, 'data.name') });
        setLoading(false);
      }
    };

    fetchEntityInfo();
  }, [entry, entityHelpers, getContentType]);

  const getEntryTitle = () => {
    if (!entry) {
      return 'Entry is missing or inaccessible';
    }
    return title ? title : 'Untitled';
  };

  return entry ? (
    <WrappedEntityCard
      entity={entry}
      entityDescription={description}
      entityTitle={getEntryTitle()}
      entityStatus={entityStatus}
      isLoading={isLoading}
      contentTypeName={contentTypeName}
      size={size}
      readOnly={true}
      selected={isSelected}
    />
  ) : null;
};

EntryLink.propTypes = {
  entry: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['Entry'])
    })
  }),
  entityHelpers: PropTypes.shape({
    entityTitle: PropTypes.func.isRequired,
    entityDescription: PropTypes.func.isRequired
  }).isRequired,
  getContentType: PropTypes.func,
  isSelected: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'small'])
};

EntryLink.defaultProps = {
  size: 'small',
  isSelected: false
};

export default EntryLink;
