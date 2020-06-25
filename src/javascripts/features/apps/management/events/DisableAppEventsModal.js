import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Note, Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  spacer: css({
    marginBottom: tokens.spacingL,
  }),
};

export function DisableAppEventsModal({ isShown, title, onClose, onDisableAppEvents }) {
  return (
    <div>
      <Modal title={title} isShown={isShown} onClose={onClose}>
        {({ title, onClose }) => (
          <React.Fragment>
            <Modal.Header title={title} onClose={onClose} testId="modal-title" />
            <Modal.Content>
              <Paragraph className={styles.spacer}>
                Disabling events will affect ALL existing app installations. Your app will cease to
                receive events. Are you sure?{' '}
              </Paragraph>
              <Note noteType="primary">This will remove the current event configuration</Note>
            </Modal.Content>
            <Modal.Controls>
              <Button
                onClick={onDisableAppEvents}
                testId="disable-app-events"
                buttonType="negative">
                Disable
              </Button>
              <Button onClick={onClose} testId="cancel-action" buttonType="muted">
                Cancel
              </Button>
            </Modal.Controls>
          </React.Fragment>
        )}
      </Modal>
    </div>
  );
}

DisableAppEventsModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onDisableAppEvents: PropTypes.func.isRequired,
};
