import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { go } from 'states/Navigator';
import { Modal, Button, Notification } from '@contentful/forma-36-react-components';
import StateRedirect from 'app/common/StateRedirect';
import { getModule } from 'core/NgRegistry';
import { loadEntry as loadEditorData } from 'app/entity_editor/DataLoader';
import * as trackVersioning from 'analytics/events/versioning';
import { LoadingState } from 'features/loading-state';

const styles = {
  loader: css({
    height: '100%',
    '> div': {
      height: '100%',
    },
  }),
};

const SnapshotRedirect = (props) => {
  const [editorData, setEditorData] = React.useState(null);
  const [snapshotId, setSnapshotId] = React.useState(null);
  const spaceContext = React.useMemo(() => getModule('spaceContext'), []); // TODO: Remove it after contract tests is fixed for cma

  React.useEffect(() => {
    loadEditorData(spaceContext, props.entryId)
      .then(setEditorData)
      .catch(() => {
        Notification.error('Entry not found.');
        go({ path: 'spaces.detail.entries.list' });
      });
  }, [spaceContext, props.entryId]);

  React.useEffect(() => {
    if (!editorData) return;

    async function init() {
      const entityId = editorData.entity.getId();
      try {
        const res = await spaceContext.cma.getEntrySnapshots(entityId, { limit: 2 });
        const firstSnapshotId = get(res, 'items[0].sys.id');
        setSnapshotId(firstSnapshotId);
      } catch (error) {} // eslint-disable-line no-empty
      trackVersioning.noSnapshots(entityId);
    }

    init();
  }, [editorData, spaceContext]);

  if (!editorData || !snapshotId) {
    return (
      <div className={styles.loader}>
        <LoadingState />
      </div>
    );
  }

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
  entryId: PropTypes.string,
};

export default SnapshotRedirect;
