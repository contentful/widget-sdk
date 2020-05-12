import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';

export const DeleteButton = ({ onClick }) => (
  <Button
    testId="delete-team-button"
    size="small"
    buttonType="negative"
    disabled={!onClick}
    onClick={onClick}>
    Delete team
  </Button>
);
DeleteButton.propTypes = { onClick: PropTypes.func };
