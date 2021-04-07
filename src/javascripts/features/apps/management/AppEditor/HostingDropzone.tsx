import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { styles } from './hostingDropzoneStyles';
import { HelpText, Notification, Spinner, Paragraph } from '@contentful/forma-36-react-components';
import { styles as appEditorStyles } from './styles';
import { createAppBundleFromFile } from './appHostingApi';
import { AppDefinitionWithBundle } from './AppHosting';
import { HostingDropdown } from './HostingDropdown';
import { createZipFromFiles } from './zipFiles';

enum DropZoneStatus {
  ACTIVE,
  IDLE,
  LOADING,
}

export interface DataLink {
  sys: {
    id: string;
    type: 'Link';
    linkType: string;
  };
}

export interface AppBundleData {
  files: Array<{
    md5: string;
    name: string;
    size: number;
  }>;
  sys: {
    appDefinition: DataLink;
    createdAt: string;
    createdBy: DataLink;
    id: string;
    organization: DataLink;
    type: 'AppBundle';
    updatedAt: string;
    updatedBy: DataLink;
  };
  comment?: string;
}

interface HostingDropzoneProps {
  definition: AppDefinitionWithBundle;
  onAppBundleCreated: (appBundle: DataLink) => void;
}

export interface FileWithPath extends File {
  path: string;
}

export function HostingDropzone({ definition, onAppBundleCreated }: HostingDropzoneProps) {
  const [dropzoneStatus, setDropzoneStatus] = React.useState(DropZoneStatus.IDLE);

  const onDrop = async (acceptedFiles: File[]) => {
    let zipFile: File | Blob | null = null;

    if (acceptedFiles.length < 1) {
      Notification.error('You tried to deploy an empty folder');
      return;
    }
    setDropzoneStatus(DropZoneStatus.LOADING);
    try {
      // File is already one zip file
      if (acceptedFiles.length === 1 && acceptedFiles[0].type === 'application/zip') {
        zipFile = acceptedFiles[0];
      } else {
        zipFile = await createZipFromFiles(acceptedFiles as FileWithPath[]);
      }
      if (!zipFile) {
        Notification.error('Something went wrong while uploading your deploy. Please try again.');
        setDropzoneStatus(DropZoneStatus.IDLE);
        return;
      }

      const bundle = await createAppBundleFromFile(definition, zipFile);
      Notification.success('Save your app to activate this bundle for all of its installations.', {
        title: 'Bundle successfully uploaded! ',
      });
      onAppBundleCreated(bundle);
    } catch (e) {
      console.error(e);
      Notification.error('Something went wrong while uploading your deploy. Please try again.');
    }
    setDropzoneStatus(DropZoneStatus.IDLE);
  };

  useEffect(() => {
    const activateDropzone = () => {
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
    <>
      <HostingDropdown definition={definition} />
      <div className={styles.dropzoneWrapper}>
        {dropzoneStatus === DropZoneStatus.ACTIVE && (
          <div data-test-id="dropzone-overlay" className={styles.activeOverlay} />
        )}
        {dropzoneStatus === DropZoneStatus.ACTIVE && <div className={styles.dropzonePlaceholder} />}
        <div
          className={styles.dropzoneContainer(dropzoneStatus === DropZoneStatus.ACTIVE)}
          data-test-id="dropzone-box"
          {...getRootProps()}>
          <input {...getInputProps()} accept="application/zip" />
          {dropzoneStatus === DropZoneStatus.LOADING ? (
            <Spinner size="large" testId="dropzone-spinner" />
          ) : (
            <Paragraph className={styles.innerText}>
              To upload, drag and drop your app output folder here
            </Paragraph>
          )}
        </div>
        <HelpText className={styles.dropzoneHelpText}>
          Using <span className={appEditorStyles.monospace}>create-contentful-app</span>? You can
          also run <span className={appEditorStyles.monospace}>npm run deploy</span> in your
          terminal.
        </HelpText>
      </div>
    </>
  );
}
