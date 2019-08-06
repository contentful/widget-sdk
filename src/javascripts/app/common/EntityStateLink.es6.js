import React from 'react';
import PropTypes from 'prop-types';
import StateLink from './StateLink.es6';

export default function EntityStateLink({ entity, children }) {
  const to =
    entity.sys.type === 'Entry' ? 'spaces.detail.entries.detail' : 'spaces.detail.assets.detail';
  const params = { [entity.sys.type === 'Entry' ? 'entryId' : 'assetId']: entity.sys.id };
  return (
    <StateLink to={to} params={params}>
      {children}
    </StateLink>
  );
}

EntityStateLink.propTypes = {
  entity: PropTypes.object.isRequired
};
