import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

import { styles } from './hostingDropzoneStyles';
import { styles as appEditorStyles } from './styles';
import { createBundle } from './appHostingApi';
import { AppDefinitionWithBundle } from './AppHosting';
import { css } from 'emotion';
import { HostingStateContext } from '../AppDetails/HostingStateProvider';
import { AppBundleData } from './types';

import { HelpText, Notification, Spinner, Paragraph } from '@contentful/forma-36-react-components';
import { validateBundle } from './bundleValidation';

enum DropZoneStatus {
  ACTIVE,
  IDLE,
  LOADING,
}

interface HostingDropzoneProps {
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
}: HostingDropzoneProps) {
  const [dropzoneStatus, setDropzoneStatus] = React.useState(DropZoneStatus.IDLE);
  const { addBundle } = React.useContext(HostingStateContext);

  const onDrop = async (acceptedFiles: File[]) => {
    const errorMessage = await validateBundle(acceptedFiles);
    if (errorMessage) {
      Notification.error(errorMessage, { title: 'Invalid bundle' });
    } else {
      setDropzoneStatus(DropZoneStatus.LOADING);
      const bundle = await createBundle(acceptedFiles, definition);
      if (bundle) {
        onAppBundleCreated(bundle);
        addBundle(bundle);
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
        Using <span className={appEditorStyles.monospace}>create-contentful-app</span>? You can also
        run <span className={appEditorStyles.monospace}>npm run deploy</span> in your terminal.
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
