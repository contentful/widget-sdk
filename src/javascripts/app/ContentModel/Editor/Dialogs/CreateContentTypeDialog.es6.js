import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import ContentTypeForm from './ContentTypeForm.es6';

export function CreateContentTypeForm(props) {
  return (
    <ContentTypeForm
      {...props}
      title="Create new content type"
      confirmLabel="Create"
      cancelLabel="Cancel"
      originalDescription=""
      originalName=""
      namePlaceholder="For example Product, Blog Post, Author"
    />
  );
}

CreateContentTypeForm.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export function CreateContentTypeDialog(props) {
  return (
    <Modal
      testId="create-content-type-modal"
      size="large"
      isShown={props.isShown}
      onClose={props.onCancel}
      allowHeightOverflow>
      {() => <CreateContentTypeForm {...props} />}
    </Modal>
  );
}

CreateContentTypeDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  existingContentTypeIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
};
