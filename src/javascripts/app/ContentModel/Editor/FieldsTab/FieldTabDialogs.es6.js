import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import { htmlEncode } from 'utils/encoder.es6';

export const DisallowDialog = ({ isShown, onClose, field, action }) => {
  const words = action === 'disable' ? ['disabled', 'disabling'] : ['deleted', 'deleting'];
  return (
    <Modal isShown={isShown} onClose={onClose}>
      {() => (
        <div>
          <Modal.Header title={`This field can’t be ${words[0]} right now`} />
          <Modal.Content>
            The field <span className="modal-dialog__highlight">{htmlEncode(field.name)}</span> acts
            as a title for this content type. Before {words[1]} it you need to choose another field
            as title.
          </Modal.Content>
          <Modal.Controls>
            <Button buttonType="positive" onClick={onClose}>
              Okay, got it
            </Button>
          </Modal.Controls>
        </div>
      )}
    </Modal>
  );
};

DisallowDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  field: PropTypes.object.isRequired,
  action: PropTypes.string.isRequired
};

export const OmitDialog = ({ isShown, onClose }) => {
  return (
    <Modal isShown={isShown} onClose={onClose}>
      {() => (
        <div>
          <Modal.Header title={`You can’t delete an active field`} />
          <Modal.Content>
            Please <em>disable in response</em> and save your content type before deleting
            a&nbsp;field. This way you can preview how your responses will look after deletion. We
            prevent deleting active fields for security reasons &ndash;&nbsp;we don’t want you to
            lose your precious content or break your apps.
          </Modal.Content>
          <Modal.Controls>
            <Button buttonType="positive" onClick={onClose}>
              Okay, disable field in response
            </Button>
          </Modal.Controls>
        </div>
      )}
    </Modal>
  );
};

OmitDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export const SaveDialog = ({ isShown, onClose }) => {
  return (
    <Modal isShown={isShown} onClose={onClose}>
      {() => (
        <div>
          <Modal.Header title={`You can’t delete the field yet`} />
          <Modal.Content>
            Please save the content type first. You’ve disabled the field, and this setting needs to
            be saved.
          </Modal.Content>
          <Modal.Controls>
            <Button buttonType="positive" onClick={onClose}>
              Save content type
            </Button>
          </Modal.Controls>
        </div>
      )}
    </Modal>
  );
};

SaveDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export const openDisallowDialog = ({ field, action }) =>
  ModalLauncher.open(({ onClose, isShown }) => (
    <DisallowDialog isShown={isShown} onClose={() => onClose(true)} field={field} action={action} />
  ));

export const openOmitDialog = () =>
  ModalLauncher.open(({ onClose, isShown }) => (
    <OmitDialog isShown={isShown} onClose={() => onClose(true)} />
  ));

export const openSaveDialog = () =>
  ModalLauncher.open(({ onClose, isShown }) => (
    <SaveDialog isShown={isShown} onClose={() => onClose(true)} />
  ));
