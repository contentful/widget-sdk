import React from 'react';
import PropTypes from 'prop-types';
import { EntityList } from '@contentful/forma-36-react-components';
import WrappedEntityListItem from './WrappedEntityListItem';

const WrappedEntityList = ({ entities, onEntityClick, contentTypes, renderDropdown }) => (
  <EntityList>
    {entities.map((entity, index) => {
      return (
        <WrappedEntityListItem
          key={`${entity.sys.id}-${index}`}
          entity={entity}
          onClick={onEntityClick ? (e, entity) => onEntityClick(e, entity, index) : undefined}
          contentType={
            contentTypes &&
            entity.sys.contentType &&
            contentTypes[entity.sys.contentType.sys.id].name
          }
          renderDropdown={renderDropdown}
        />
      );
    })}
  </EntityList>
);

WrappedEntityList.propTypes = {
  entities: PropTypes.array.isRequired,
  onEntityClick: PropTypes.func,
  contentTypes: PropTypes.object,
  /**
   * Optional function to render a list of dropdown elements for a single entity
   *
   * @param {object} props
   * @param {object} props.entity The fetched entity for this list item
   */
  renderDropdown: PropTypes.func,
};

export default WrappedEntityList;
