import React from 'react';
import PropTypes from 'prop-types';
import { Button, Flex } from '@contentful/forma-36-react-components';

export const BulkActionsButton = ({ label, visible, onClick, ...props }) => {
  if (!visible) {
    return null;
  }
  const lowerLabel = label.toLowerCase();
  return (
    <Flex marginRight="spacingS">
      <Button
        buttonType="muted"
        {...props}
        testId={lowerLabel}
        onClick={() => onClick(lowerLabel)}
        size="small">
        {label}
      </Button>
    </Flex>
  );
};

BulkActionsButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  visible: PropTypes.bool,
  label: PropTypes.string.isRequired,
  buttonType: PropTypes.string,
};
