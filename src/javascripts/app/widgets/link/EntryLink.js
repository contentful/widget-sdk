import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import WrappedEntityCard from 'app/widgets/shared/FetchedEntityCard/WrappedEntityCard';
import { getState, stateName } from 'data/CMA/EntityState';

const EntryLink = ({ entry, entityHelpers, getContentType, onClick, isSelected, size }) => {
  const state = entry ? getState(entry.sys) : undefined;
  const entityStatus = state ? stateName(state) : undefined;
  const [{ title, description, contentTypeName, file }, setEntityInfo] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(
    () => {
      const fetchEntityInfo = async () => {
        let contentType;
        if (getContentType) {
          contentType = await getContentType(entry);
        }
        const [title, file, description] = await Promise.all([
          entityHelpers.entityTitle(entry),
          entityHelpers.entityFile(entry),
          entityHelpers.entityDescription(entry),
        ]);

        setEntityInfo({
          title,
          description,
          contentTypeName: get(contentType, 'data.name'),
          file,
        });
        setLoading(false);
      };

      if (entry) {
        fetchEntityInfo();
      }
    },
    // we want to fetch this information only once so we don't subscribe for dependnecies here
    // it's a performance optimization to avoid refetching /assets/:id on every render
    // eslint-disable-next-line
    []
  );

  const getEntryTitle = () => {
    if (!entry) {
      return 'Entry is missing or inaccessible';
    }
    return title ? title : 'Untitled';
  };

  const shouldSizeBeDefault = !!(file || description);
  const cardSize = size || shouldSizeBeDefault ? 'default' : 'small';

  return entry ? (
    <WrappedEntityCard
      entity={entry}
      entityType={get(entry, 'sys.type', 'Entry')}
      entityFile={file}
      entityId={get(entry, 'sys.id')}
      entityDescription={description}
      entityTitle={getEntryTitle()}
      entityStatus={entityStatus}
      isLoading={isLoading}
      contentTypeName={contentTypeName}
      size={cardSize}
      readOnly={true}
      selected={isSelected}
      onClick={onClick}
    />
  ) : null;
};

EntryLink.propTypes = {
  entry: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['Entry']),
    }),
  }),
  entityHelpers: PropTypes.shape({
    entityTitle: PropTypes.func.isRequired,
    entityDescription: PropTypes.func.isRequired,
    entityFile: PropTypes.func.isRequired,
  }).isRequired,
  getContentType: PropTypes.func,
  isSelected: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'small']),
  onClick: PropTypes.func,
};

EntryLink.defaultProps = {
  isSelected: false,
};

export default EntryLink;
