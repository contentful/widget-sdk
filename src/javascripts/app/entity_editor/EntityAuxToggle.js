import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';

const EntityAuxToggle = ({ onClick, isActive }) => (
  <Button buttonType="muted" isActive={isActive} onClick={onClick}>
    Info
  </Button>
);

EntityAuxToggle.propTypes = {
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired
};

export default EntityAuxToggle;
