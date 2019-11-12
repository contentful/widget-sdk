import React from 'react';
import PropTypes from 'prop-types';
import { EntityList } from '@contentful/forma-36-react-components';
import WrappedEntityListItem from './WrappedEntityListItem';

const WrappedEntityList = ({ entities, internalLocaleCode, onEntityClick, contentTypes }) => (
  <EntityList>
    {entities.map(entity => {
      return (
        <WrappedEntityListItem
          key={entity.sys.id}
          entity={entity}
          internalLocaleCode={internalLocaleCode}
          onClick={onEntityClick ? (e, entity) => onEntityClick(e, entity) : undefined}
          contentType={contentTypes && contentTypes[entity.sys.contentType.sys.id].name}
        />
      );
    })}
  </EntityList>
);

WrappedEntityList.propTypes = {
  entities: PropTypes.array.isRequired,
  internalLocaleCode: PropTypes.string,
  onEntityClick: PropTypes.func,
  contentTypes: PropTypes.object
};

export default WrappedEntityList;
