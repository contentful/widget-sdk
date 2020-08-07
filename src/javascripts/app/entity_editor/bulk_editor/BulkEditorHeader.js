import React from 'react';
import PropTypes from 'prop-types';
import { Workbench, Heading, Button } from '@contentful/forma-36-react-components';

export const BulkEditorHeader = ({ fieldName, linkCount, onBack, onClose }) => {
  return (
    <Workbench.Header
      onBack={onBack}
      title={
        <Heading element="h1">
          Entries linked in <em>{fieldName}</em> ({linkCount})
        </Heading>
      }
      actions={
        <Button buttonType="muted" onClick={onClose}>
          Close
        </Button>
      }
    />
  );
};

BulkEditorHeader.propTypes = {
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  fieldName: PropTypes.string.isRequired,
  linkCount: PropTypes.number.isRequired,
};
