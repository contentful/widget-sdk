import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isAdmin } from 'core/services/SpaceEnvContext/utils';
import { ReactRouterRedirect } from 'core/react-routing';

export function AdminOnly(props) {
  const { currentSpace } = useSpaceEnvContext();

  if (isAdmin(currentSpace)) {
    return props.children;
  }

  if (props.render) {
    return props.render(StateRedirect);
  }

  return <ReactRouterRedirect route={{ path: 'entries.list' }} />;
}

AdminOnly.propTypes = {
  children: PropTypes.any,
  render: PropTypes.func,
};

AdminOnly.displayName = 'AdminOnly';
