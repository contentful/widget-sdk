import React from 'react';
import PropTypes from 'prop-types';
import { ConnectedRichTextEditor } from '@contentful/field-editor-rich-text';
import { EntityProvider } from '@contentful/field-editor-reference';
import { rtSdkDecorator } from './rtSdkDecorator';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';

export default function ReadOnlyRichTextEditor({ value, sdk }) {
  const { currentSpace } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const richTextSdk = rtSdkDecorator(sdk, isMasterEnvironment);

  return (
    <EntityProvider sdk={sdk}>
      <ConnectedRichTextEditor
        value={value}
        sdk={richTextSdk}
        isToolbarHidden
        actionsDisabled
        readOnly
        isDisabled
      />
    </EntityProvider>
  );
}

ReadOnlyRichTextEditor.propTypes = {
  value: PropTypes.object.isRequired,
  sdk: PropTypes.object.isRequired,
};
