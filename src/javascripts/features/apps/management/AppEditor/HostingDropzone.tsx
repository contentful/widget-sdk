import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { HelpText, Notification, Spinner, Paragraph } from '@contentful/forma-36-react-components';
import { styles as appEditorStyles } from './styles';
import { createAppBundleFromFile } from './appHostingApi';
import { AppDefinitionWithBundle } from './AppHosting';
import { HostingDropdown } from './HostingDropdown';

const styles = {
  dropzoneWrapper: css({
    position: 'relative',
    marginBottom: tokens.spacingXl,
  }),
  dropzonePlaceholder: css({
    height: '128px',
  }),
  dropzoneHelpText: css({
    fontSize: tokens.fontSizeS,
    marginTop: tokens.spacingXs,
  }),
  dropzoneContainer: (active: boolean) =>
    css({
      border: `2px dashed ${tokens.colorElementLight}`,
      borderRadius: tokens.borderRadiusMedium,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: tokens.spacing2Xl,
      zIndex: tokens.zIndexModalContent,
      top: '0',
      position: active ? 'absolute' : 'initial',
      width: active ? '820px' : 'auto',
      background: tokens.colorElementLightest,
      [':focus']: {
        outline: `${tokens.colorElementMid} auto 2px`,
      },
    }),
  activeOverlay: css({
    height: '100vh',
    width: '100vw',
    background: tokens.colorTextDark,
    opacity: 0.7,
    top: 0,
    left: 0,
    zIndex: tokens.zIndexModal,
    position: 'fixed',
  }),
  innerText: css({
    userSelect: 'none',
  }),
};

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

export function HostingDropzone({ definition, onAppBundleCreated }: HostingDropzoneProps) {
  const [dropzoneStatus, setDropzoneStatus] = React.useState(DropZoneStatus.IDLE);

  const onDrop = async (acceptedFiles: File[]) => {
    // currently only accepting one zip file otherwise throwing an error
    if (acceptedFiles.length > 1 || acceptedFiles[0].type !== 'application/zip') {
      Notification.error('The file you uploaded is not valid. Make sure it is only one zip-file.');
      return;
    }
    setDropzoneStatus(DropZoneStatus.LOADING);
    try {
      const bundle = await createAppBundleFromFile(definition, acceptedFiles[0]);
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
