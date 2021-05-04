import React from 'react';
import { getState } from 'data/CMA/EntityState';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import { Icon } from '@contentful/forma-36-react-components';
import { Tag } from '@contentful/forma-36-react-components';
import { EntryProps, AssetProps, EntityMetaSysProps } from 'contentful-management/types';
import { Release } from '@contentful/types';
import { css } from 'emotion';

const styles = {
  statusTransition: css({
    display: 'flex',
    alignItems: 'center',
  }),
};

type StatusTransitionProps = {
  entity: EntryProps | AssetProps | Release;
};

function StatusTransition({ entity }: StatusTransitionProps) {
  return (
    <span className={styles.statusTransition} color="secondary">
      <EntityStatusTag statusLabel={getState(entity.sys as EntityMetaSysProps)} />
      <Icon color="secondary" icon="ChevronRight" />
      <Tag tagType="positive">Published</Tag>
    </span>
  );
}

export { StatusTransition };
