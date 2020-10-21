import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import WrappedEntityCard from 'app/widgets/shared/FetchedEntityCard/WrappedEntityCard';
import { getState, stateName } from 'data/CMA/EntityState';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const EntryLink = ({ entry, entityHelpers, onClick, isSelected, size }) => {
  const { currentSpaceContentTypes = [] } = useSpaceEnvContext();
  const [{ title, description, file }, setEntityInfo] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(
    () => {
      const fetchEntityInfo = async () => {
        const [title, file, description] = await Promise.all([
          entityHelpers.entityTitle(entry),
          entityHelpers.entityFile(entry),
          entityHelpers.entityDescription(entry),
        ]);

        setEntityInfo({
          title,
          description,
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

  if (!entry) {
    return null;
  }

  const state = getState(entry.sys);
  const entityStatus = stateName(state);

  const contentType = currentSpaceContentTypes.find(
    (ct) => ct.sys.id === entry.sys.contentType.sys.id
  );

  const shouldSizeBeDefault = !!(file || description);
  const cardSize = size || shouldSizeBeDefault ? 'default' : 'small';

  return (
    <WrappedEntityCard
      entity={entry}
      entityType={get(entry, 'sys.type', 'Entry')}
      entityFile={file}
      entityId={get(entry, 'sys.id')}
      entityDescription={description}
      entityTitle={title || 'Untitled'}
      entityStatus={entityStatus}
      isLoading={isLoading}
      contentTypeName={get(contentType, 'name')}
      size={cardSize}
      readOnly={true}
      selected={isSelected}
      onClick={onClick}
    />
  );
};

EntryLink.propTypes = {
  entry: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['Entry']),
      contentType: PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired,
        }).isRequired,
      }).isRequired,
    }),
  }),
  entityHelpers: PropTypes.shape({
    entityTitle: PropTypes.func.isRequired,
    entityDescription: PropTypes.func.isRequired,
    entityFile: PropTypes.func.isRequired,
  }).isRequired,
  isSelected: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'small']),
  onClick: PropTypes.func,
};

EntryLink.defaultProps = {
  isSelected: false,
};

export default EntryLink;
