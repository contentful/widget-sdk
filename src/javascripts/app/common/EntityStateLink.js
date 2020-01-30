import React from 'react';
import PropTypes from 'prop-types';
import StateLink from './StateLink';
import { getModule } from 'NgRegistry';

export default function EntityStateLink({ entity, children }) {
  const spaceContext = getModule('spaceContext');
  const { id, type } = entity.sys;
  const path = ['spaces', 'detail', type === 'Entry' ? 'entries' : 'assets', 'detail'];
  if (!spaceContext.isMasterEnvironment()) {
    path.splice(2, 0, 'environment');
  }
  const params = { [type === 'Entry' ? 'entryId' : 'assetId']: id };

  return (
    <StateLink path={path.join('.')} params={params}>
      {children}
    </StateLink>
  );
}

EntityStateLink.propTypes = {
  entity: PropTypes.object.isRequired
};
