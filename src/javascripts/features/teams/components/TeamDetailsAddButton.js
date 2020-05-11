import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';

export const TeamDetailsAddButton = ({ label, onClick, disabled, className }) => (
  <Button
    testId="add-button"
    buttonType="primary"
    onClick={onClick}
    disabled={disabled}
    className={className}>
    {label}
  </Button>
);
TeamDetailsAddButton.propTypes = {
  onClick: PropTypes.func,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};
TeamDetailsAddButton.defaultProps = {
  onClick: () => {},
  disabled: false,
};
