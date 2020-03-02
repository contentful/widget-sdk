import React from 'react';
import PropTypes from 'prop-types';
import StateLink from './StateLink';
import { href } from 'states/Navigator';
import { getModule } from 'NgRegistry';

export function getEntityLink({ id, type }) {
  const spaceContext = getModule('spaceContext');
  const path = ['spaces', 'detail', type === 'Entry' ? 'entries' : 'assets', 'detail'];
  if (!spaceContext.isMasterEnvironment()) {
    path.splice(2, 0, 'environment');
  }
  const params = { [type === 'Entry' ? 'entryId' : 'assetId']: id };

  return {
    path: path.join('.'),
    params,
    href: href({
      path,
      params
    })
  };
}

// TODO: Pass `entityId` and `entityType` as separate props as this is not a whole entity.

export default function EntityStateLink({ entity, children }) {
  const { id, type } = entity.sys;

  const { path, params } = getEntityLink({ id, type });

  return (
    <StateLink path={path} params={params}>
      {children}
    </StateLink>
  );
}

EntityStateLink.propTypes = {
  entity: PropTypes.object.isRequired
};
