import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import { FieldModalDialogForm } from './FieldModalDialogForm';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { CurrentSpaceAPIClientProvider } from 'core/services/APIClient/CurrentSpaceAPIClientContext';
import { FieldDialogProvider } from './components/FieldDialogContext';

const FieldModalDialog = ({
  isShown,
  onClose,
  field: ctField,
  widget,
  contentType,
  updateFieldOnScope,
  editorInterface,
  customWidgets,
}) => {
  return (
    <SpaceEnvContextProvider>
      <CurrentSpaceAPIClientProvider>
        <FieldDialogProvider
          field={ctField}
          contentType={contentType}
          editorInterface={editorInterface}>
          <Modal isShown={isShown} onClose={onClose} size="60em">
            {({ onClose }) => (
              <FieldModalDialogForm
                onClose={onClose}
                ctField={ctField}
                widget={widget}
                contentType={contentType}
                updateFieldOnScope={updateFieldOnScope}
                editorInterface={editorInterface}
                customWidgets={customWidgets}
              />
            )}
          </Modal>
        </FieldDialogProvider>
      </CurrentSpaceAPIClientProvider>
    </SpaceEnvContextProvider>
  );
};

FieldModalDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  field: PropTypes.object,
  widget: PropTypes.object.isRequired,
  contentType: PropTypes.object.isRequired,
  updateFieldOnScope: PropTypes.func.isRequired,
  editorInterface: PropTypes.object.isRequired,
  customWidgets: PropTypes.array.isRequired,
};

const openFieldModalDialog = (
  field,
  widget,
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
      contentType={contentType}
      updateFieldOnScope={updateFieldOnScope}
      editorInterface={editorInterface}
      customWidgets={customWidgets}
    />
  ));
};

export { openFieldModalDialog };
