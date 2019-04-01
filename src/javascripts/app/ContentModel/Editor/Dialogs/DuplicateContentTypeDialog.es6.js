import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Note } from '@contentful/forma-36-react-components';
import ContentTypeForm from './ContentTypeForm.es6';

export function DuplicateContentTypeForm(props) {
  return (
    <ContentTypeForm
      {...props}
      title="Duplicate content type"
      confirmLabel="Duplicate"
      cancelLabel="Cancel"
      namePlaceholder={`Duplicate of "${props.originalName}"`}>
      <Note testId="duplicate-content-type-note">
        You&apos;re about to duplicate the content type <strong>{props.originalName}</strong> with
        all existing fields. No entries will be duplicated.
      </Note>
    </ContentTypeForm>
  );
}

DuplicateContentTypeForm.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  originalName: PropTypes.string.isRequired
};

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
  existingContentTypeIds: PropTypes.arrayOf(PropTypes.string.isRequired)
};
