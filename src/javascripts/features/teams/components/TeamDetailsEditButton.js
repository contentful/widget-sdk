import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';

export const EditButton = ({ onClick }) => (
  <Button
    testId="edit-team-button"
    size="small"
    buttonType="muted"
    disabled={!onClick}
    onClick={onClick}>
    Edit team details
  </Button>
);
EditButton.propTypes = { onClick: PropTypes.func };
