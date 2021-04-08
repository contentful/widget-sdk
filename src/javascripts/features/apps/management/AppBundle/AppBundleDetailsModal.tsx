import React from 'react';
import {
  CopyButton,
  Modal,
  ModalLauncher,
  Paragraph,
  DateTime,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { AppBundleData } from '../AppEditor';
import { copyButton } from '../styles';

const styles = {
  metaInfo: css({
    marginLeft: `-${tokens.spacingL}`,
    marginRight: `-${tokens.spacingL}`,
    paddingLeft: tokens.spacingL,
    paddingRight: tokens.spacingL,
    paddingBottom: tokens.spacingS,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
  }),
  infoWrapper: css({
    marginBottom: tokens.spacingXs,
  }),
  infoAbout: css({
    color: tokens.colorTextDark,
    fontWeight: tokens.fontWeightDemiBold,
  }),
  fileWrapper: css({
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingS,
    display: 'flex',
  }),
  fileNameWrapper: css({
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    direction: 'rtl',
    textAlign: 'left',
  }),
  filePath: css({
    color: tokens.colorTextLightest,
  }),
  fileName: css({
    color: tokens.colorTextDark,
  }),
  fileSize: css({
    flexGrow: 1,
    paddingLeft: tokens.spacing2Xl,
    fontFamily: tokens.fontStackMonospace,
    textAlign: 'right',
    display: 'inline-block',
    whiteSpace: 'nowrap',
    color: tokens.colorTextLightest,
  }),
  copyButton: css({
    display: 'inline-block',
    backgroundColor: 'transparent',
    border: 'none',
    height: '24px',
    button: css({
      paddingTop: tokens.spacing2Xs,
      border: 'none',
    }),
    'span[role="tooltip"]': css({
      whiteSpace: 'nowrap',
      paddingTop: '5px',
      paddingBottom: '5px',
    }),
  }),
};

export const parseFileSize = (size: number): string => {
  const kbInBytes = 1000;
  const mbInBytes = kbInBytes * 1000;

  if (size > mbInBytes) {
    return `${parseFloat((size / mbInBytes).toString()).toFixed(2)} MB`;
  } else if (size > kbInBytes) {
    return `${parseFloat((size / kbInBytes).toString()).toFixed(2)} KB`;
  } else {
    return `${size} B`;
  }
};

export const splitFileAndPath = (fullPath: string): { name: string; path: string } => {
  const indexOfFileNameStart = fullPath.lastIndexOf('/') + 1;
  const name = fullPath.substring(indexOfFileNameStart);
  const path = fullPath.substring(0, indexOfFileNameStart);

  return {
    name,
    path,
  };
};

const AppBundleDetailsModal = ({ isOpen, onClose, appBundle }) => {
  return (
    <Modal isShown={isOpen} onClose={onClose}>
      {() => (
        <>
          <Modal.Header title={'Inspect bundle'} onClose={onClose} />
          <Modal.Content>
            <div className={styles.metaInfo}>
              <Paragraph className={styles.infoWrapper}>
                <span className={styles.infoAbout}>ID:</span> {appBundle.sys.id}
              </Paragraph>
              <Paragraph className={styles.infoWrapper}>
                <span className={styles.infoAbout}>Uploaded at</span>{' '}
                <DateTime date={appBundle.sys.createdAt} />
              </Paragraph>
            </div>
            {appBundle.files.map((file) => {
              const parsedFileName = splitFileAndPath(file.name);

              return (
                <div className={styles.fileWrapper} key={file.md5}>
                  <span className={styles.fileNameWrapper}>
                    <CopyButton
                      className={`${copyButton} ${styles.copyButton}`}
                      copyValue={file.md5}
                      tooltipText={'Copy md5 hash'}
                      tooltipCopiedText={'Copied'}
                      tooltipPlace={'right'}
                    />
                    <span className={styles.filePath}>{parsedFileName.path}</span>
                    <span className={styles.fileName}>{parsedFileName.name}</span>
                  </span>
                  <span className={styles.fileSize}>{parseFileSize(file.size)}</span>
                </div>
              );
            })}
          </Modal.Content>
        </>
      )}
    </Modal>
  );
};

export const openAppBundleDetailModal = (appBundle: AppBundleData): void => {
  ModalLauncher.open(({ isShown, onClose }) => {
    return <AppBundleDetailsModal isOpen={isShown} onClose={onClose} appBundle={appBundle} />;
  });
};
