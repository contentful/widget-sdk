import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isAdmin } from 'core/services/SpaceEnvContext/utils';

export function AdminOnly(props) {
  const { currentSpace } = useSpaceEnvContext();

  if (isAdmin(currentSpace)) {
    return props.children;
  }

  if (props.render) {
    return props.render(StateRedirect);
  }

  return <StateRedirect path={props.redirect} />;
}

AdminOnly.propTypes = {
  children: PropTypes.any,
  render: PropTypes.func,
  redirect: PropTypes.string,
};

AdminOnly.displayName = 'AdminOnly';

AdminOnly.defaultProps = {
  redirect: 'spaces.detail.entries.list',
};
