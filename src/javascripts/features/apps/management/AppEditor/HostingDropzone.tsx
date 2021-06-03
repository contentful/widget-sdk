import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

import { styles } from './hostingDropzoneStyles';
import { styles as appEditorStyles } from './styles';
import { createUpload, createBundleFromUpload } from './appHostingApi';
import { AppDefinitionWithBundle } from './AppHosting';
import { css } from 'emotion';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';
import { AppBundleData } from './types';

import {
  HelpText,
  Notification,
  Spinner,
  Paragraph,
  TextLink,
} from '@contentful/forma-36-react-components';
import { validateBundle } from './bundleValidation';
import { openCommentModal } from './HostingDropzoneCommentModal';

enum DropZoneStatus {
  ACTIVE,
  IDLE,
  LOADING,
}

interface HostingDropzoneProps {
  link?: { title: string; onLinkClick: () => void };
  definition: AppDefinitionWithBundle;
  onAppBundleCreated: (appBundle: AppBundleData) => void;
  containerStyles?: string;
}

export interface FileWithPath extends File {
  path: string;
}

export function HostingDropzone({
  definition,
  onAppBundleCreated,
  containerStyles,
  link,
}: HostingDropzoneProps) {
  const [dropzoneStatus, setDropzoneStatus] = React.useState(DropZoneStatus.IDLE);
  const { addBundle } = React.useContext(HostingStateContext);

  const onDrop = async (acceptedFiles: File[]) => {
    const validationResult = await validateBundle(acceptedFiles);
    if (validationResult?.type === 'error') {
      Notification.error(validationResult.message, { title: 'Invalid bundle' });
    } else {
      const { uploadRequest, addProgressListener, cancelUploadRequest } = createUpload(
        acceptedFiles,
        definition
      );

      const commentModalResult = await openCommentModal(
        addProgressListener,
        uploadRequest,
        validationResult
      );

      if (commentModalResult.kind === 'cancel') {
        cancelUploadRequest();
      } else {
        setDropzoneStatus(DropZoneStatus.LOADING);
        try {
          const upload = await uploadRequest;

          // If upload was cancelled, then the result could be void.
          // This isn't going to be happen, because we only cancel in the other
          // branch of this if.
          if (upload) {
            const bundle = await createBundleFromUpload(
              definition,
              upload,
              commentModalResult.comment
            );
            if (bundle) {
              onAppBundleCreated(bundle);
              addBundle(bundle);
            }
          }
        } catch (e) {
          Notification.error(
            e.data?.message ||
              'Something went wrong while uploading your deploy. Please try again.',
            { title: e.data?.message ? 'Invalid bundle' : undefined }
          );
        }
      }
    }

    setDropzoneStatus(DropZoneStatus.IDLE);
  };

  const dropzoneRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activateDropzone = () => {
      if (!isInViewport(dropzoneRef.current)) {
        dropzoneRef.current?.scrollIntoView({ block: 'center' });
      }
      setDropzoneStatus(DropZoneStatus.ACTIVE);
    };
    const deActivateDropzone = () => {
      if (dropzoneStatus !== DropZoneStatus.LOADING) {
        setDropzoneStatus(DropZoneStatus.IDLE);
      }
    };
    window.addEventListener('dragenter', activateDropzone);
    window.addEventListener('mouseout', deActivateDropzone);
    return () => {
      window.removeEventListener('dragenter', activateDropzone);
      window.removeEventListener('mouseout', deActivateDropzone);
    };
  }, [dropzoneStatus]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div ref={dropzoneRef} className={styles.dropzoneWrapper}>
      {dropzoneStatus === DropZoneStatus.ACTIVE && (
        <div data-test-id="dropzone-overlay" className={styles.activeOverlay} />
      )}
      {dropzoneStatus === DropZoneStatus.ACTIVE && <div className={styles.dropzonePlaceholder} />}
      <div
        className={css`
          ${styles.dropzoneContainer(dropzoneStatus === DropZoneStatus.ACTIVE)}
          ${containerStyles}
        `}
        data-test-id="dropzone-box"
        {...getRootProps()}>
        <input {...getInputProps()} accept="application/zip" />
        {dropzoneStatus === DropZoneStatus.LOADING ? (
          <Spinner size="large" testId="dropzone-spinner" />
        ) : (
          <Paragraph className={styles.innerText}>
            {definition.bundle
              ? 'To update, drag and drop your app output folder here'
              : 'To upload, drag and drop your app output folder here'}
          </Paragraph>
        )}
      </div>
      <HelpText className={styles.dropzoneHelpText}>
        <span>
          Using <span className={appEditorStyles.monospace}>create-contentful-app</span>? You can
          also run <span className={appEditorStyles.monospace}>npm run upload</span> in your
          terminal.
        </span>
        {link && (
          <TextLink className={styles.helpTextLink} onClick={link.onLinkClick}>
            {link.title}
          </TextLink>
        )}
      </HelpText>
    </div>
  );
}

function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
