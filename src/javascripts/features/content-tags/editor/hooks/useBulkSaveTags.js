import React, { useEffect, useMemo, useState } from 'react';
import useBulkActions from 'components/tabs/useBulkActions';
import { Modal, Spinner } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  modal: css({
    Button: {
      display: 'none',
    },
  }),
  content: css({
    padding: tokens.spacing2Xl,
    display: 'flex',
    justifyContent: 'center',
  }),
};

const useBulkSaveTags = (onClose) => {
  const [isRunning, setIsRunning] = useState(false);
  const [entities, setEntities] = useState([]);
  const entityType = entities.length > 0 ? entities[0].getSys().type : 'UNKNOWN';
  const [{ actions }] = useBulkActions({
    entityType,
    entities,
  });

  const progressComponent = useMemo(() => {
    if (!isRunning) {
      return null;
    }
    return (
      <Modal
        className={styles.modal}
        size={'small'}
        isShown={true}
        onClose={() => {}}
        title={'Updating tags'}
        shouldCloseOnEscapePress={false}
        shouldCloseOnOverlayClick={false}>
        <div className={styles.content}>
          <Spinner size={'large'} />
        </div>
      </Modal>
    );
  }, [isRunning]);

  useEffect(() => {
    if (entities.length > 0) {
      (async () => {
        setIsRunning(true);
        await actions.updateTagSelected();
        setIsRunning(false);
        onClose();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities]);

  return { setEntities, progressComponent, isRunning };
};

export { useBulkSaveTags };
