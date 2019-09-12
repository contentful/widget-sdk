import React, { useCallback } from 'react';

import PropTypes from 'prop-types';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import {
  EntityListItem,
  SkeletonContainer,
  SkeletonImage,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import EntityStateLink from 'app/common/EntityStateLink.es6';
import useAsync from 'app/common/hooks/useAsync.es6';

import * as AssetUrlService from 'services/AssetUrlService.es6';

import { getEntityData } from './EntityService.es6';

const styles = {
  entryListItem: css({
    cursor: 'pointer',
    marginBottom: 0,
    h1: {
      lineHeight: 'inherit'
    }
  }),
  skeleton: css({
    marginTop: tokens.spacingS
  }),
  skeletonListItem: css({
    height: `calc(1rem * (62 / ${tokens.fontBaseDefault}))`,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    overflow: 'hidden',
    padding: `0 ${tokens.spacingS}`
  })
};

export default function WrappedEntityListItem({
  entity,
  internalLocaleCode,
  onClick,
  contentType
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
            onClick={e => (onClick ? onClick(e, entity) : onClickGoToEntry(e, entity))}
            key={entity.sys.id}
            title={entityData.title || 'Untitled'}
            contentType={contentType}
            thumbnailUrl={
              entityData.file
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
  contentType: PropTypes.string
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
