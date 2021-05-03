import React from 'react';
import { noop } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import {
  Paragraph,
  Modal,
  ModalLauncher,
  Typography,
  TextField,
  Button,
  Spinner,
  Icon,
} from '@contentful/forma-36-react-components';

const styles = {
  progress: css({ display: 'flex', marginBottom: tokens.spacingM }),
  progressText: css({ fontWeight: tokens.fontWeightDemiBold, color: tokens.colorTextDark }),
  progressNumbers: css({
    fontVariantNumeric: 'tabular-nums',
  }),
  spinner: css({ marginRight: tokens.spacingXs }),
  icon: css({ marginRight: tokens.spacingXs }),
};

interface Cancel {
  kind: 'cancel';
}
interface Result {
  kind: 'result';
  comment: string;
}
type ModalResult = Cancel | Result;

interface AppUploadCommentModalProps {
  isOpen: boolean;
  onClose: (result: ModalResult) => void;
  addProgressListener: (callback: (progress: number) => void) => void;
  uploadRequest: Promise<unknown>;
}

const AppUploadCommentModal: React.FC<AppUploadCommentModalProps> = ({
  isOpen,
  onClose,
  addProgressListener,
  uploadRequest,
}) => {
  const [uploadFinished, setUploadFinished] = React.useState(false);

  React.useEffect(() => {
    uploadRequest.then(() => {
      setUploadFinished(true);
    });
  }, [setUploadFinished, uploadRequest]);

  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    addProgressListener((progress: number) => {
      if (progress === 100) {
        setProgress(99);
      } else {
        setProgress(progress);
      }
    });
  }, [setProgress, addProgressListener]);

  const [comment, setComment] = React.useState('');
  return (
    <Modal isShown={isOpen} onClose={noop}>
      {() => (
        <>
          <Modal.Header title={'Upload bundle'} />
          <Modal.Content>
            <span className={styles.progress}>
              {uploadFinished ? (
                <>
                  <Icon className={styles.icon} icon="CheckCircle" color="positive" />
                  <Paragraph className={styles.progressText}>
                    Bundle successfully uploaded
                  </Paragraph>
                </>
              ) : (
                <>
                  <Spinner className={styles.spinner} />{' '}
                  <Paragraph className={styles.progressText}>
                    Uploading (<span className={styles.progressNumbers}>{progress}%</span>)
                  </Paragraph>
                </>
              )}
            </span>
            <Typography>
              <Paragraph>
                Optionally, add a comment that describes this bundle. Tip: Good bundle comments
                contain fewer than 50 characters.
              </Paragraph>
            </Typography>
            <TextField
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
              labelText="Comment"
              id="bundle-comment"
              name="bundle-comment"
              textInputProps={{
                placeholder: 'e.g. Add sidebar functionality, Fix render issue',
                value: comment,
                maxLength: 255,
                autoFocus: true,
              }}
            />
          </Modal.Content>
          <Modal.Controls>
            <Button
              size="small"
              disabled={!uploadFinished}
              onClick={() => onClose({ kind: 'result', comment })}
              buttonType="positive">
              Finish
            </Button>
            <Button size="small" onClick={() => onClose({ kind: 'cancel' })} buttonType="muted">
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

export const openCommentModal = (
  addProgressListener: (callback: (progress: number) => void) => void,
  uploadRequest: Promise<unknown>
): Promise<ModalResult> =>
  ModalLauncher.open(({ isShown, onClose }) => {
    return (
      <AppUploadCommentModal
        isOpen={isShown}
        onClose={onClose}
        addProgressListener={addProgressListener}
        uploadRequest={uploadRequest}
      />
    );
  });
