import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { FieldModalDialogForm } from './FieldModalDialogForm';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { CurrentSpaceAPIClientProvider } from 'core/services/APIClient/CurrentSpaceAPIClientContext';

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
    <SpaceEnvContextProvider>
      <CurrentSpaceAPIClientProvider>
        <Modal isShown={isShown} onClose={onClose} size="60em" allowHeightOverflow>
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
      </CurrentSpaceAPIClientProvider>
    </SpaceEnvContextProvider>
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

export { openFieldModalDialog };
