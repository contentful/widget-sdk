import React, { useState, useEffect } from 'react';
import { get, find } from 'lodash';
import PropTypes from 'prop-types';
import { Notification } from '@contentful/forma-36-react-components';
import { FileEditorActions } from './FileEditorActions';
import { FileEditorArchived } from './FileEditorArchived';
import { FileEditorLoading } from './FileEditorLoading';
import { FileEditorMetadata } from './FileEditorMetadata';
import { FileEditorPreview } from './FileEditorPreview';
import { FileEditorUploader } from './FileEditorUploader';
import * as ImageOperations from './ImageOperations';

function promiseTimeout(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

async function retry(fn, num) {
  try {
    return await fn();
  } catch (err) {
    if (num >= 0) {
      await promiseTimeout(200);
      return await retry(fn, num - 1);
    } else {
      return Promise.reject(err);
    }
  }
}

function notifyEditError(err) {
  if (!err || !err.cancelled) {
    Notification.error('An error occurred while editing your asset.');
  }
}

function isUnprocessedFile(file) {
  // File uploaded but not processed (there is no `file.url` yet).
  return !!(file && file.upload && !file.url);
}

export default function FileEditor(props) {
  const { file, disabled, archived, processAsset, setValue, maybeSetTitle } = props;
  const [showMetaData, setShowMetaData] = useState(false);
  const [isBusy, setBusy] = useState(false);

  const isUnprocessed = Boolean(file && isUnprocessedFile(file));

  useEffect(() => {
    async function tryToProcessAsset() {
      if (isUnprocessed) {
        try {
          await promiseTimeout(200);
          await retry(processAsset, 3);
        } catch (err) {
          setValue(null);
          const errors = get(err, ['body', 'details', 'errors'], []);
          const invalidContentTypeErr = find(errors, { name: 'invalidContentType' });
          Notification.error(
            invalidContentTypeErr
              ? invalidContentTypeErr.details
              : 'An error occurred while processing your asset.'
          );
        }
      }
    }
    tryToProcessAsset();
  }, [isUnprocessed, processAsset, setValue]);

  async function updateFile(file) {
    if (!file) {
      await setValue(null);
      return;
    } else {
      await maybeSetTitle(file.fileName);
      await setValue(file);
    }
  }

  const performImageOperation = async (fn, mode) => {
    setBusy(true);

    try {
      const uploadUrl = await fn(mode, file);
      if (uploadUrl) {
        updateFile({
          upload: uploadUrl,
          fileName: file.fileName,
          contentType: file.contentType
        });
      }
    } catch (err) {
      if (err) {
        notifyEditError(err);
      }
    }

    setBusy(false);
  };

  if (!file) {
    return <FileEditorUploader onSuccess={updateFile} disabled={disabled} />;
  }

  if (archived) {
    return <FileEditorArchived file={file} />;
  }

  if (disabled) {
    return (
      <div className="file-info">
        {!file.url || isUnprocessed ? <FileEditorLoading /> : <FileEditorPreview file={file} />}
      </div>
    );
  }

  return (
    <>
      <div className="file-info">
        {isUnprocessed && <FileEditorLoading message="Processing..." />}
        {file.url && !isUnprocessed && <FileEditorPreview file={file} />}
        {showMetaData && <FileEditorMetadata file={file} />}
      </div>
      <FileEditorActions
        file={file}
        disabled={disabled || isBusy}
        onToggleMeta={() => {
          setShowMetaData(!showMetaData);
        }}
        onRotate={mode => {
          performImageOperation(ImageOperations.rotateOrMirror, mode);
        }}
        onResize={mode => {
          performImageOperation(ImageOperations.resize, mode);
        }}
        onCrop={async mode => {
          setBusy(true);
          try {
            const updatedFile = await ImageOperations.crop(mode, file);
            if (updatedFile) {
              updateFile(updatedFile);
            }
          } catch (err) {
            if (err) {
              notifyEditError(err);
            }
          }
          setBusy(false);
        }}
        onDelete={() => {
          updateFile(null);
        }}
      />
    </>
  );
}

FileEditor.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string.isRequired,
    fileName: PropTypes.string,
    contentType: PropTypes.string
  }),
  setValue: PropTypes.func.isRequired,
  processAsset: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  archived: PropTypes.bool,
  maybeSetTitle: PropTypes.func.isRequired
};
