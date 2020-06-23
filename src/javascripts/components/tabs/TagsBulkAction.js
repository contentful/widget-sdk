import { ModalLauncher } from 'core/components/ModalLauncher';
import { Button, Modal, Workbench } from '@contentful/forma-36-react-components';
import React, { useCallback, useEffect } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import Keys from 'app/ContentList/Search/Keys';
import {
  AddOrRemoveTags,
  BulkTaggingProvider,
  SlideIn,
  useBulkTaggingProvider,
  useComputeTags,
  useBulkSaveTags,
} from 'features/content-tags';
import PropTypes from 'prop-types';
import { usePrevious } from 'core/hooks';

const styles = {
  tagsContent: css({
    width: '100%',
  }),
  workbench: css({
    marginBottom: '110px',
  }),
  footer: css({
    position: 'fixed',
    bottom: '0px',
    right: 0,
    width: 'inherit',
    backgroundColor: tokens.colorElementLightest,
    borderTop: `1px solid ${tokens.colorElementDarkest}`,
    boxShadow: tokens.boxShadowDefault,
    padding: `${tokens.spacingM} ${tokens.spacingL}`,
  }),
  button: css({
    marginRight: tokens.spacingM,
  }),
  historyContainer: css({
    float: 'right',
  }),
};

const ConfirmModal = ({ onClose, onSave, confirmIsShown, confirmOnClose }) => {
  return (
    <Modal
      size={'large'}
      onClose={confirmOnClose}
      isShown={confirmIsShown}
      title={'You have unsaved changes'}>
      <Button
        buttonType={'primary'}
        className={styles.button}
        onClick={() => {
          confirmOnClose();
          onSave();
        }}>
        Save and close
      </Button>
      <Button
        buttonType={'negative'}
        className={styles.button}
        onClick={() => {
          onClose();
          confirmOnClose();
        }}>
        Discard changes
      </Button>
      <Button
        buttonType={'muted'}
        className={styles.button}
        onClick={() => {
          confirmOnClose();
        }}>
        Return to editing
      </Button>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  confirmIsShown: PropTypes.bool.isRequired,
  confirmOnClose: PropTypes.func.isRequired,
};

const launchConfirmModal = (onClose, onSave) => {
  ModalLauncher.open(({ isShown: confirmIsShown, onClose: confirmOnClose }) => {
    return (
      <ConfirmModal
        onClose={onClose}
        onSave={onSave}
        confirmIsShown={confirmIsShown}
        confirmOnClose={confirmOnClose}
      />
    );
  });
};

const TagsBulkContent = ({ isShown, onClose, selectedEntities }) => {
  const { hasChanges, back, forward } = useBulkTaggingProvider();
  const { computeEntities } = useComputeTags();
  const { setEntities, progressComponent } = useBulkSaveTags(onClose);
  const onKeyDown = useCallback(
    (event) => {
      if (Keys.control(event) && event.metaKey && event.shiftKey) {
        forward();
      } else if (Keys.control(event) && event.metaKey) {
        back();
      }
    },
    [back, forward]
  );

  const listenerRef = usePrevious(onKeyDown);

  useEffect(() => {
    const type = 'keydown';
    const target = window;
    if (listenerRef) {
      target.removeEventListener(type, listenerRef);
    }
    if (isShown) {
      target.addEventListener(type, onKeyDown);
    }
  }, [onKeyDown, listenerRef, isShown]);

  const onSave = useCallback(() => {
    const transformedEntities = computeEntities(selectedEntities);
    setEntities(transformedEntities);
  }, [computeEntities, selectedEntities, setEntities]);

  const close = useCallback(() => {
    if (hasChanges) {
      launchConfirmModal(onClose, onSave);
    } else {
      onClose();
    }
  }, [onClose, onSave, hasChanges]);

  return (
    <>
      {progressComponent}
      <SlideIn isShown={isShown} onClose={close}>
        <Workbench className={styles.workbench}>
          <Workbench.Header title={'Add or remove tags'} />
          <div className={styles.tagsContent}>
            <AddOrRemoveTags selectedEntities={selectedEntities} />
          </div>
        </Workbench>
        <div className={styles.footer}>
          <Button disabled={!hasChanges} className={styles.button} onClick={onSave}>
            Save
          </Button>
          <Button buttonType={'naked'} onClick={close}>
            Cancel
          </Button>
        </div>
      </SlideIn>
    </>
  );
};

TagsBulkContent.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedEntities: PropTypes.array.isRequired,
};

const TagsBulkAction = (selectedEntities) => {
  ModalLauncher.open(
    ({ isShown, onClose }) => {
      return (
        <BulkTaggingProvider>
          <TagsBulkContent
            isShown={isShown}
            onClose={onClose}
            selectedEntities={selectedEntities}
          />
        </BulkTaggingProvider>
      );
    },
    { modalId: 'bulk-tagging' }
  );
};

export { TagsBulkAction };