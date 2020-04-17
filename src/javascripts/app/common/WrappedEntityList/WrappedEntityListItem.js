import React, { useCallback } from 'react';

import PropTypes from 'prop-types';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import {
  EntityListItem,
  SkeletonContainer,
  SkeletonImage,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import EntityStateLink from 'app/common/EntityStateLink';
import { useAsync } from 'core/hooks';

import * as AssetUrlService from 'services/AssetUrlService';

import { getEntityData } from './EntityService';

const styles = {
  entryListItem: css({
    cursor: 'pointer',
    marginBottom: 0,
    h1: {
      lineHeight: 'inherit',
    },
  }),
  skeleton: css({
    marginTop: tokens.spacingS,
  }),
  skeletonListItem: css({
    height: `calc(1rem * (62 / ${tokens.fontBaseDefault}))`,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    overflow: 'hidden',
    padding: `0 ${tokens.spacingS}`,
  }),
};

export default function WrappedEntityListItem({
  entity,
  internalLocaleCode,
  onClick,
  contentType,
  renderDropdown,
}) {
  const getEntityDataFn = useCallback(() => {
    return getEntityData(entity, internalLocaleCode);
  }, [entity, internalLocaleCode]);

  const { isLoading, data: entityData } = useAsync(getEntityDataFn);
  return isLoading ? (
    <EntityListItemSkeleton />
  ) : (
    <EntityStateLink key={entity.sys.id} entity={entity}>
      {({ onClick: onClickGoToEntry, getHref }) => {
        return (
          <EntityListItem
            className={styles.entryListItem}
            onClick={(e) => (onClick ? onClick(e, entity) : onClickGoToEntry(e, entity))}
            key={entity.sys.id}
            title={entityData.title || 'Untitled'}
            contentType={contentType}
            dropdownListElements={renderDropdown && renderDropdown({ entity })}
            entityType={entity.sys.type && entity.sys.type.toLowerCase()}
            thumbnailUrl={
              entityData.file && entityData.status !== 'archived'
                ? `${AssetUrlService.transformHostname(entityData.file.url)}?w=46&h=46&fit=thumb`
                : ''
            }
            thumbnailAltText={entityData.title}
            description={entityData.description}
            status={entityData.status}
            href={onClick && getHref()}
          />
        );
      }}
    </EntityStateLink>
  );
}

WrappedEntityListItem.propTypes = {
  entity: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  internalLocaleCode: PropTypes.string,
  contentType: PropTypes.string,
  /**
   * Optional function to render a list of dropdown elements
   *
   * @param {object} props
   * @param {object} props.entity The fetched entity for this list item
   */
  renderDropdown: PropTypes.func,
};

function EntityListItemSkeleton() {
  return (
    <li className={styles.skeletonListItem}>
      <SkeletonContainer svgHeight={45} className={styles.skeleton}>
        <SkeletonImage width={36} height={36} />
        <SkeletonBodyText offsetLeft={50} offsetTop={2} lineHeight={12} numberOfLines={2} />
      </SkeletonContainer>
    </li>
  );
}
