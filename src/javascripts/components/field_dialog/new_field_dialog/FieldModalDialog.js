import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { ModalLauncher } from 'core/components/ModalLauncher';
import FieldModalDialogForm from './FieldModalDialogForm';

const FieldModalDialog = ({
  isShown,
  onClose,
  field: ctField,
  widget,
  spaceContext,
  contentType,
  updateFieldOnScope,
  editorInterface,
  customWidgets,
}) => {
  return (
    <Modal isShown={isShown} onClose={onClose} size="60em">
      {({ onClose }) => (
        <FieldModalDialogForm
          onClose={onClose}
          ctField={ctField}
          widget={widget}
          spaceContext={spaceContext}
          contentType={contentType}
          updateFieldOnScope={updateFieldOnScope}
          editorInterface={editorInterface}
          customWidgets={customWidgets}
        />
      )}
    </Modal>
  );
};

FieldModalDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  field: PropTypes.object,
  widget: PropTypes.object.isRequired,
  spaceContext: PropTypes.object.isRequired,
  contentType: PropTypes.object.isRequired,
  updateFieldOnScope: PropTypes.func.isRequired,
  editorInterface: PropTypes.object.isRequired,
  customWidgets: PropTypes.array.isRequired,
};

const openFieldModalDialog = (
  field,
  widget,
  spaceContext,
  contentType,
  updateFieldOnScope,
  editorInterface,
  customWidgets
) => {
  return ModalLauncher.open(({ isShown, onClose }) => (
    <FieldModalDialog
      isShown={isShown}
      onClose={onClose}
      field={field}
      widget={widget}
      spaceContext={spaceContext}
      contentType={contentType}
      updateFieldOnScope={updateFieldOnScope}
      editorInterface={editorInterface}
      customWidgets={customWidgets}
    />
  ));
};

export default openFieldModalDialog;