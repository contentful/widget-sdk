import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, Notification } from '@contentful/forma-36-react-components';
import * as Filestack from 'services/Filestack';

let dropPaneMountCount = 0;

export function FileEditorUploader(props) {
  const { disabled, onSuccess } = props;
  const dropPaneRef = useRef(null);

  useEffect(() => {
    if (!disabled && dropPaneRef && dropPaneRef.current) {
      dropPaneMountCount += 1;
      const id = '__filestack-drop-pane-mount-' + dropPaneMountCount;
      dropPaneRef.current.id = id;
      Filestack.makeDropPane({
        id,
        onSuccess,
      });
    }
  }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSelectFile = () => {
    Filestack.pick()
      .then(onSuccess)
      .catch(() => {
        Notification.error('An error occurred while uploading your asset.');
      });
  };

  return (
    <div className="file-info">
      <div className="file-selector">
        <div ref={dropPaneRef} className="__filestack-drop-pane-mount"></div>
        <div className="file-selector-btn-wrapper">
          <Button
            buttonType="muted"
            testId="file-editor-select"
            onClick={onSelectFile}
            disabled={disabled}>
            Open file selector
          </Button>
        </div>
      </div>
    </div>
  );
}

FileEditorUploader.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};
