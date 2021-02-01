import React, { useCallback } from 'react';

import PropTypes from 'prop-types';

import { css } from 'emotion';
import pluralize from 'pluralize';
import tokens from '@contentful/forma-36-tokens';

import {
  EntityListItem,
  SkeletonContainer,
  SkeletonImage,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import EntityStateLink from 'app/common/EntityStateLink';
import { useAsync } from 'core/hooks';
import { useSpaceEnvCMAClient } from 'core/services/usePlainCMAClient';

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

const getItemsCountByLinkType = (release, linkType) =>
  release.entities.items.filter((item) => item.sys.linkType === linkType).length;

const getReleaseDescription = (release) => {
  const entriesCount = getItemsCountByLinkType(release, 'Entry');
  const assetsCount = getItemsCountByLinkType(release, 'Asset');

  const entry = entriesCount && pluralize('entry', entriesCount, true);
  const asset = assetsCount && pluralize('asset', assetsCount, true);

  if (entry && asset) {
    return `${entry}, ${asset}`;
  }

  return entry || asset;
};

export default function WrappedEntityListItem({ entity, onClick, contentType, renderDropdown }) {
  const { spaceEnvCMAClient } = useSpaceEnvCMAClient();

  const getEntityDataFn = useCallback(() => {
    return getEntityData(spaceEnvCMAClient, entity);
  }, [entity, spaceEnvCMAClient]);

  const { isLoading, data } = useAsync(getEntityDataFn);
  const entityData =
    entity.sys.type === 'Release'
      ? { ...entity, description: getReleaseDescription(entity) || 'No content' }
      : data;

  return isLoading ? (
    <EntityListItemSkeleton />
  ) : (
    <EntityStateLink key={entity.sys.id} entity={entity}>
      {({ onClick: onClickGoToEntity, getHref }) => {
        return (
          <EntityListItem
            className={styles.entryListItem}
            onClick={(e) => (onClick ? onClick(e, entity) : onClickGoToEntity(e, entity))}
            key={entity.sys.id}
            title={entityData.title || 'Untitled'}
            contentType={entity.sys.type === 'Release' ? 'Release' : contentType}
            dropdownListElements={renderDropdown && renderDropdown({ entity })}
            entityType={entity.sys.type}
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
