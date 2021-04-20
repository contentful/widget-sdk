import React from 'react';
import PropTypes from 'prop-types';
import { EntityList } from '@contentful/forma-36-react-components';
import WrappedEntityListItem from './WrappedEntityListItem';
import { getLaunchAppDeepLink } from 'features/contentful-apps';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import EntityStateLink from 'app/common/EntityStateLink';

const WrappedEntityList = ({ entities, onEntityClick, contentTypes, renderDropdown }) => {
  const { currentEnvironmentAliasId, currentEnvironmentId, currentSpaceId } = useSpaceEnvContext();
  return (
    <EntityList>
      {entities.map((entity, index) => {
        return (
          <EntityStateLink key={`${entity.sys.id}-${index}`} entity={entity}>
            {({ onClick: onClickGoToEntity, getHref }) => {
              const isRelease = entity.sys.type === 'Release';

              let clickHandler;
              if (!isRelease) {
                clickHandler = onEntityClick
                  ? (e, entity) => onEntityClick(e, entity, index)
                  : onClickGoToEntity;
              }

              let href = onEntityClick && getHref();
              if (isRelease) {
                href = getLaunchAppDeepLink(
                  currentSpaceId,
                  currentEnvironmentAliasId || currentEnvironmentId,
                  entity.sys.id
                );
              }

              return (
                <WrappedEntityListItem
                  key={entity.sys.id}
                  entity={entity}
                  onClick={clickHandler}
                  contentType={
                    contentTypes &&
                    entity.sys.contentType &&
                    contentTypes[entity.sys.contentType.sys.id].name
                  }
                  renderDropdown={renderDropdown}
                  href={href}
                />
              );
            }}
          </EntityStateLink>
        );
      })}
    </EntityList>
  );
};

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
