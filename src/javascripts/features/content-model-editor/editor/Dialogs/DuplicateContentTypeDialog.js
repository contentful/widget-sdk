import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { DuplicateContentTypeForm } from './DuplicateContentTypeForm';

export function DuplicateContentTypeDialog(props) {
  return (
    <Modal
      testId="duplicate-content-type-modal"
      size="large"
      isShown={props.isShown}
      onClose={props.onCancel}
      allowHeightOverflow>
      {() => <DuplicateContentTypeForm {...props} />}
    </Modal>
  );
}

DuplicateContentTypeDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  originalName: PropTypes.string.isRequired,
  originalDescription: PropTypes.string,
  existingContentTypeIds: PropTypes.arrayOf(PropTypes.string.isRequired),
};
