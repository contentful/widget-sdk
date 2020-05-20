import React from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from '@contentful/forma-36-react-components';

export const TeamDetailsAddButton = ({
  label,
  onClick,
  disabled,
  readOnlyPermission,
  className,
}) => {
  if (readOnlyPermission) {
    return (
      <Tooltip
        testId="read-only-tooltip"
        place="left"
        content="You don't have permission to change this team">
        <Button
          testId="add-button"
          buttonType="primary"
          onClick={onClick}
          disabled={disabled}
          className={className}>
          {label}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button
      testId="add-button"
      buttonType="primary"
      onClick={onClick}
      disabled={disabled}
      className={className}>
      {label}
    </Button>
  );
};

TeamDetailsAddButton.propTypes = {
  onClick: PropTypes.func,
  label: PropTypes.string.isRequired,
  readOnlyPermission: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

TeamDetailsAddButton.defaultProps = {
  onClick: () => {},
  disabled: false,
  readOnlyPermission: true,
};
