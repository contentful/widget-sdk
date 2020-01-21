import React from 'react';
import PropTypes from 'prop-types';
import { FieldConnector } from '@contentful/field-editor-shared';
import FileEditor from './FileEditor';
import * as stringUtils from 'utils/StringUtils';

export default function FileEditorConnected(props) {
  const { sdk } = props;

  const maybeSetTitle = fileName => {
    if (sdk.entry.fields.title && !sdk.entry.fields.title.getValue()) {
      const newTitle = stringUtils.fileNameToTitle(fileName);
      sdk.entry.fields.title.setValue(newTitle);
    }
  };

  const processAsset = async () => {
    const assetSys = sdk.entry.getSys();
    const asset = await sdk.space.getAsset(assetSys.id);
    await sdk.space.processAsset(asset, sdk.field.locale);
    await sdk.space.waitUntilAssetProcessed(assetSys.id, sdk.field.locale);
  };

  return (
    <FieldConnector throttle={0} field={sdk.field} isInitiallyDisabled={props.isInitiallyDisabled}>
      {({ value, disabled, setValue }) => {
        return (
          <FileEditor
            file={value}
            setValue={setValue}
            maybeSetTitle={maybeSetTitle}
            disabled={disabled}
            processAsset={processAsset}
          />
        );
      }}
    </FieldConnector>
  );
}

FileEditorConnected.propTypes = {
  sdk: PropTypes.object.isRequired,
  isInitiallyDisabled: PropTypes.bool
};

FileEditorConnected.defaultProps = {
  isInitiallyDisabled: true
};
