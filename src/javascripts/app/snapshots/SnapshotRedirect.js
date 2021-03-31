import React from 'react';
import PropTypes from 'prop-types';
import { go } from 'states/Navigator';
import { Modal, Button } from '@contentful/forma-36-react-components';
import StateRedirect from 'app/common/StateRedirect';

const SnapshotRedirect = ({ snapshotId }) => {
  if (snapshotId) {
    return (
      <StateRedirect
        path=".withCurrent"
        params={{
          snapshotId,
          source: 'entryEditor',
        }}
      />
    );
  }
  return (
    <Modal
      title="This entry has no versions"
      onClose={() => go({ path: '^' })}
      shouldCloseOnEscapePress={false}
      shouldCloseOnOverlayClick={false}
      isShown>
      {({ title, onClose }) => (
        <React.Fragment>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            It seems that this entry doesn’t have any versions yet. As you update it, new versions
            will be created and you will be able to review and compare them.
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} buttonType="positive">
              OK
            </Button>
          </Modal.Controls>
        </React.Fragment>
      )}
    </Modal>
  );
};

SnapshotRedirect.propTypes = {
  snapshotId: PropTypes.string,
};

export default SnapshotRedirect;
