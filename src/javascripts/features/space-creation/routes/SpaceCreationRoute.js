import React from 'react';
import PropTypes from 'prop-types';
import { SpaceCreation } from '../components/SpaceCreation';

export const SpaceCreationRoute = ({ orgId }) => {
  return <SpaceCreation orgId={orgId} />;
};

SpaceCreationRoute.propTypes = {
  orgId: PropTypes.string,
};
